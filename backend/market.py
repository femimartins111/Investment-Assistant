import os
import requests
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Set ALPHA_VANTAGE_API_KEY in your environment / .env file instead of
# hardcoding it here.
API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY")


def get_time_series(symbol):
    if not API_KEY:
        raise RuntimeError(
            "ALPHA_VANTAGE_API_KEY is not set. "
            "Set it in your environment before calling get_time_series()."
        )

    url = (
        "https://www.alphavantage.co/query"
        f"?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}"
    )
    response = requests.get(url)
    data = response.json()
    return data


def json_to_dataframe(data):

    time_series = data["Time Series (Daily)"]

    df = pd.DataFrame.from_dict(
        time_series,
        orient="index"
    )

    df = df.rename(columns={
        "1. open": "open",
        "2. high": "high",
        "3. low": "low",
        "4. close": "close",
        "5. volume": "volume"
    })

    df.index = pd.to_datetime(df.index)

    df = df.sort_index()

    df = df.astype({
        "open": float,
        "high": float,
        "low": float,
        "close": float,
        "volume": int
    })

    return df


def calculate_rsi(df, period=14):

    df["change"] = df["close"].diff()

    df["gain"] = df["change"].where(df["change"] > 0, 0)
    df["loss"] = -df["change"].where(df["change"] < 0, 0)

    df["avg_gain"] = df["gain"].rolling(window=period, min_periods=1).mean()
    df["avg_loss"] = df["loss"].rolling(window=period, min_periods=1).mean()

    # Guard against division by zero:
    #  - avg_loss == 0 and avg_gain > 0  -> pure uptrend, RSI should be 100
    #  - avg_loss == 0 and avg_gain == 0 -> no movement at all, RSI = 50 (neutral)
    with np.errstate(divide="ignore", invalid="ignore"):
        df["rs"] = df["avg_gain"] / df["avg_loss"]

    df["rsi"] = 100 - (100 / (1 + df["rs"]))

    no_loss_mask = df["avg_loss"] == 0
    no_gain_mask = df["avg_gain"] == 0

    df.loc[no_loss_mask & ~no_gain_mask, "rsi"] = 100
    df.loc[no_loss_mask & no_gain_mask, "rsi"] = 50

    return df


def calculate_macd(df, short_window=12, long_window=26, signal_window=9):
    df["ema_short"] = df["close"].ewm(span=short_window, adjust=False).mean()
    df["ema_long"] = df["close"].ewm(span=long_window, adjust=False).mean()

    df["macd"] = df["ema_short"] - df["ema_long"]

    df["signal_line"] = df["macd"].ewm(span=signal_window, adjust=False).mean()

    df["macd_histogram"] = df["macd"] - df["signal_line"]

    return df


def plot_macd(df):
    plt.figure(figsize=(12, 5))

    plt.plot(df.index, df["macd"], label="MACD Line")
    plt.plot(df.index, df["signal_line"], label="Signal Line")

    plt.bar(df.index, df["macd_histogram"], label="Histogram")

    plt.axhline(0, linestyle="--")

    plt.title("MACD")
    plt.legend()
    plt.show()


def plot_rsi(df):
    plt.figure(figsize=(12, 6))

    plt.subplot(2, 1, 1)
    plt.plot(df.index, df["close"], label="Close Price")
    plt.title("Close Price")
    plt.legend()

    plt.subplot(2, 1, 2)
    plt.plot(df.index, df["rsi"], label="RSI", color="orange")
    plt.axhline(70, color="red", linestyle="--")
    plt.axhline(30, color="green", linestyle="--")
    plt.title("Relative Strength Index (RSI)")
    plt.legend()

    plt.tight_layout()
    plt.show()


def macd_interpretation(df):
    latest = df.iloc[-1]

    macd = latest["macd"]
    signal = latest["signal_line"]
    histogram = latest["macd_histogram"]

    if macd > signal and histogram > 0:
        return (
            "MACD is bullish. The MACD line is above the signal line, "
            "suggesting upward momentum."
        )

    elif macd < signal and histogram < 0:
        return (
            "MACD is bearish. The MACD line is below the signal line, "
            "suggesting weakening or downward momentum."
        )

    else:
        return (
            "MACD is neutral or mixed. Momentum is not giving a clear signal."
        )


def rsi_interpretation(rsi):
    if rsi > 70:
        return "The Stock has been Overbought"
    elif rsi < 30:
        return "The Stock has been Oversold"
    else:
        return "The Stock is Neutral"


if __name__ == "__main__":
    symbol = "AAPL"
    data = get_time_series(symbol)
    df = json_to_dataframe(data)
    df4 = calculate_rsi(df)
    df5 = calculate_macd(df4)
    plot_macd(df5)
    plot_rsi(df4)
    print(macd_interpretation(df5))
    print(rsi_interpretation(df4["rsi"].iloc[-1]))
