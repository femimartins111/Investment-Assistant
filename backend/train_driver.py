import time
import pandas as pd

from market import get_time_series, json_to_dataframe, calculate_rsi, calculate_macd
from mlstocks import train_stock_model


TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META"]

REQUEST_DELAY = 1.5


def prepare_stock_dataframe(symbol):
    print(f"Fetching data for {symbol}...")

    data = get_time_series(symbol)

    if "Note" in data:
        print("Alpha Vantage rate limit hit.")
        print(data["Note"])
        return "RATE_LIMIT"

    if "Error Message" in data:
        print(f"Skipping {symbol}. Invalid ticker or API error.")
        print("Response:", data)
        return None

    if "Time Series (Daily)" not in data:
        print(f"Skipping {symbol}. Alpha Vantage did not return daily data.")
        print("Response:", data)
        return None

    df = json_to_dataframe(data)
    df = calculate_rsi(df)
    df = calculate_macd(df)

    df["ticker"] = symbol

    if "Note" in data:
        print("Alpha Vantage rate limit hit.")
        print(data["Note"])
        return "RATE_LIMIT"

    return df


def build_training_dataset(tickers):
    all_dataframes = []

    for ticker in tickers:
        df = prepare_stock_dataframe(ticker)

        if isinstance(df, str) and df == "RATE_LIMIT":
            print("Stopping early because API limit was reached.")
            break

        if df is not None:
            all_dataframes.append(df)

        print(f"Waiting {REQUEST_DELAY} seconds before next request...\n")
        time.sleep(REQUEST_DELAY)

    

    if not all_dataframes:
        raise ValueError("No stock data was collected. Check your API key, ticker list, or daily API limit.")
    combined_df = pd.concat(all_dataframes)
    return combined_df


def main():
    print("Starting model training...")

    training_df = build_training_dataset(TICKERS)

    print("Training rows:", len(training_df))
    print("Columns:", list(training_df.columns))

    model = train_stock_model(training_df)

    print("Training complete.")
    print("Saved model as stock_prediction_model.pkl")


if __name__ == "__main__":
    main()