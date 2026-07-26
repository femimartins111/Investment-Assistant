from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv; load_dotenv() 
import tempfile
import os
import math


from Csv_loader import load_portfolio_data
from tickgetter import (
    yfinance_data_equity,
    analyze_portfolio,
    portfolio_summary
)
from market import (
    get_time_series,
    json_to_dataframe,
    calculate_rsi,
    calculate_macd,
    rsi_interpretation,
    macd_interpretation
)
from predictgrowth import predict_growth
from dbauth import store_portfolio_data, get_latest_portfolio_data


app = FastAPI()

# Allows React frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PORTFOLIOS = {}


def clean_number(value):
    if value is None:
        return None

    try:
        if isinstance(value, float) and math.isnan(value):
            return None
    except TypeError:
        pass

    return value


def portfolio_dict_to_list(portfolio):
    result = []

    for company, data in portfolio.items():
        row = {
            "company": company,
            "ticker": data.get("ticker"),
            "amount_invested": clean_number(data.get("amount_invested")),
            "purchase_date": data.get("purchase_date") or data.get("buy_date"),
            "current_price": clean_number(data.get("current_price")),
            "sector": data.get("sector", "Unknown"),
            "industry": data.get("industry", "Unknown"),
            "up_shares": clean_number(data.get("up_shares")),
            "profit_loss": clean_number(data.get("profit_loss")),
        }

        result.append(row)

    return result


@app.get("/")
def home():
    return {
        "message": "Investment backend is running"
    }


@app.post("/api/portfolio/upload")
async def upload_portfolio(
    file: UploadFile = File(...),
    userId: str = Form(...)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    temp_file_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        portfolio = load_portfolio_data(temp_file_path)

        # Normalize date column if needed
        for company, data in portfolio.items():
            if "purchase_date" not in data and "buy_date" in data:
                data["purchase_date"] = data["buy_date"]

        # Add yfinance data
        portfolio = yfinance_data_equity(portfolio)

        # Add profit/loss calculations
        portfolio = analyze_portfolio(portfolio)

        PORTFOLIOS[userId] = portfolio

        # Best-effort persistence to Postgres. If the DB is unreachable
        # or misconfigured, don't fail the upload -- the in-memory
        # cache above still serves the current session.
        try:
            store_portfolio_data(userId, portfolio)
        except Exception as db_error:
            print(f"Warning: could not persist portfolio to DB: {db_error}")

        return portfolio_dict_to_list(portfolio)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading portfolio: {str(e)}"
        )

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.get("/api/portfolio/{user_id}")
def get_portfolio(user_id: str):
    if user_id not in PORTFOLIOS:
        # Fall back to Postgres if this process doesn't have it cached
        # (e.g. after a restart).
        db_portfolio = None
        try:
            db_portfolio = get_latest_portfolio_data(user_id)
        except Exception as db_error:
            print(f"Warning: could not read portfolio from DB: {db_error}")

        if db_portfolio is None:
            raise HTTPException(
                status_code=404,
                detail="Portfolio not found. Upload a CSV first."
            )

        PORTFOLIOS[user_id] = db_portfolio

    return portfolio_dict_to_list(PORTFOLIOS[user_id])


@app.get("/api/portfolio/summary/{user_id}")
def get_summary(user_id: str):
    if user_id not in PORTFOLIOS:
        raise HTTPException(
            status_code=404,
            detail="Portfolio not found. Upload a CSV first."
        )

    summary = portfolio_summary(PORTFOLIOS[user_id])

    return {
        "total_invested": clean_number(summary["total_invested"]),
        "total_profit_loss": clean_number(summary["total_profit_loss"]),
        "current_value": clean_number(summary["current_value"]),
        "return_percent": clean_number(summary["return_percent"]),
    }


@app.get("/api/stocks/predict/{symbol}")
def get_prediction(symbol: str):
    try:
        symbol = symbol.upper()

        data = get_time_series(symbol)

        if "Note" in data:
            raise HTTPException(
                status_code=429,
                detail="Alpha Vantage rate limit reached. Try again later."
            )

        if "Error Message" in data:
            raise HTTPException(
                status_code=400,
                detail="Invalid stock symbol."
            )

        if "Time Series (Daily)" not in data:
            raise HTTPException(
                status_code=400,
                detail="Could not get stock data from Alpha Vantage."
            )

        df = json_to_dataframe(data)
        df = calculate_rsi(df)
        df = calculate_macd(df)

        latest = df.iloc[-1]

        features = {
            "open": latest["open"],
            "high": latest["high"],
            "low": latest["low"],
            "close": latest["close"],
            "volume": latest["volume"],
            "rsi": latest["rsi"],
            "macd": latest["macd"],
            "signal_line": latest["signal_line"]
        }

        prediction = predict_growth(symbol, features)

        return {
            "symbol": prediction["symbol"],
            "predicted_growth_percent": prediction["predicted_growth_percent"],
            "latest_price": clean_number(float(latest["close"])),
            "rsi": clean_number(float(latest["rsi"])),
            "rsi_interpretation": rsi_interpretation(latest["rsi"]),
            "macd": clean_number(float(latest["macd"])),
            "signal_line": clean_number(float(latest["signal_line"])),
            "macd_interpretation": macd_interpretation(df)
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )
