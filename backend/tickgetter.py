import os
import json
import pandas as pd
import yfinance as yf

# Resolve stocks.json relative to this file, so it works regardless of
# the process's current working directory.
_STOCKS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stocks.json")


def get_ticker_info(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        return {
            'current_price': info.get('currentPrice', None),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown')
        }
    except Exception:
        return {
            'current_price': None,
            'sector': 'Unknown',
            'industry': 'Unknown'
        }


def yfinance_data_equity(portfolio):
    with open(_STOCKS_JSON_PATH, "r") as f:
        valid_tickers = set(json.load(f))

    for company, data in portfolio.items():
        ticker = data["ticker"]
        if ticker in valid_tickers:
            info = get_ticker_info(ticker)
            data["current_price"] = info["current_price"]
            data["sector"] = info["sector"]
            data["industry"] = info["industry"]
    return portfolio


def _normalize_date(raw_date):
    """
    Parses common date formats (M/D/YYYY, YYYY-MM-DD, Jan 10 2024, etc.)
    into a pandas Timestamp. Returns None if the value is missing or
    can't be parsed at all, rather than raising -- callers treat None
    as "no price available".
    """
    if not raw_date:
        return None

    try:
        return pd.to_datetime(raw_date)
    except (ValueError, TypeError):
        return None


def _get_purchase_price(ticker_instance, purchase_date):
    """
    Look up the closing price on the given purchase date.
    Returns None if no data is available for that date, or if the
    date couldn't be parsed.
    """
    parsed_date = _normalize_date(purchase_date)
    if parsed_date is None:
        return None

    # Yahoo/yfinance treats `end` as exclusive, so asking for the same
    # start and end date can come back empty even on a real trading
    # day. Widen the window by one day to reliably capture that date's
    # bar (weekends/holidays still just mean no data -- handled below).
    start_str = parsed_date.strftime("%Y-%m-%d")
    end_str = (parsed_date + pd.Timedelta(days=1)).strftime("%Y-%m-%d")

    historical_data = ticker_instance.history(
        start=start_str, end=end_str
    )
    if historical_data.empty:
        return None
    # Use .iloc[0] (positional) rather than [0] (label-based),
    # since indexing a Series by integer position is deprecated
    # when the index itself isn't a simple RangeIndex.
    return historical_data['Close'].iloc[0]


def _get_valuation_for_ticker(data):
    """
    Compute purchase shares, current shares, current value, and
    profit/loss for a single portfolio entry, making only one
    yfinance.Ticker() call and one .info lookup.
    """
    ticker = data["ticker"]
    ticker_instance = yf.Ticker(ticker)

    current_price = ticker_instance.info.get("currentPrice")
    purchase_price = _get_purchase_price(ticker_instance, data.get("purchase_date"))

    if current_price is None or purchase_price is None or purchase_price == 0:
        return None

    amount_invested = data["amount_invested"]

    past_shares = amount_invested / purchase_price
    current_shares_equiv = amount_invested / current_price
    current_value = past_shares * current_price

    return {
        # Positive when the price has risen since purchase (fewer
        # shares would be needed today to match the original
        # investment amount), negative when it has fallen.
        "up_shares": past_shares - current_shares_equiv,
        "up_value": current_value - amount_invested,
    }


def share_current_calculator(portfolio, ticker):
    for company, data in portfolio.items():
        if data["ticker"] == ticker:
            ticker_instance = yf.Ticker(ticker)
            current_price = ticker_instance.info.get("currentPrice", None)
            return data["amount_invested"] / current_price if current_price else None
    return None


def share_historical_calculator(portfolio, ticker):
    for company, data in portfolio.items():
        if data["ticker"] == ticker:
            ticker_instance = yf.Ticker(ticker)
            purchase_price = _get_purchase_price(ticker_instance, data.get("purchase_date"))
            if not purchase_price:
                return None
            return data["amount_invested"] / purchase_price
    return None


def current_value_calculator(portfolio, ticker):
    for company, data in portfolio.items():
        if data["ticker"] == ticker:
            valuation = _get_valuation_for_ticker(data)
            if valuation is None:
                return None
            return valuation["up_value"] + data["amount_invested"]
    return None


def current_valuation(portfolio, ticker):
    for company, data in portfolio.items():
        if data["ticker"] == ticker:
            return _get_valuation_for_ticker(data)
    return None


def analyze_portfolio(portfolio):
    for company, data in portfolio.items():
        valuation = _get_valuation_for_ticker(data)

        if valuation is not None:
            data["up_shares"] = valuation["up_shares"]
            data["profit_loss"] = valuation["up_value"]

    return portfolio


def portfolio_summary(portfolio):
    total_invested = 0
    total_profit_loss = 0

    for company, data in portfolio.items():
        total_invested += data.get("amount_invested") or 0
        total_profit_loss += data.get("profit_loss") or 0

    return_percent = (
        (total_profit_loss / total_invested) * 100
        if total_invested
        else 0
    )

    return {
        "total_invested": total_invested,
        "total_profit_loss": total_profit_loss,
        "current_value": total_invested + total_profit_loss,
        "return_percent": return_percent,
    }
