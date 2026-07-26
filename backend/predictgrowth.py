import os
import joblib
import pandas as pd


FEATURES = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "rsi",
    "macd",
    "signal_line"
]

MODEL_PATH = os.environ.get("STOCK_MODEL_PATH", "stock_prediction_model.pkl")

# Load the model once when this module is imported, rather than on
# every call to predict_growth(). This avoids re-reading the (possibly
# large) .pkl file from disk on every API request.
try:
    _model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    _model = None
    print(
        f"Warning: model file not found at '{MODEL_PATH}'. "
        "Run train_driver.py to generate it before calling predict_growth()."
    )


def load_model():
    """
    Returns the model loaded at import time. Kept as a function so
    existing callers/tests that expect load_model() still work.
    """
    if _model is None:
        raise RuntimeError(
            f"Model not loaded (missing file at '{MODEL_PATH}'). "
            "Run train_driver.py first."
        )
    return _model


def predict_growth(symbol, features):
    model = load_model()

    x_input = pd.DataFrame([{
        "open": features["open"],
        "high": features["high"],
        "low": features["low"],
        "close": features["close"],
        "volume": features["volume"],
        "rsi": features["rsi"],
        "macd": features["macd"],
        "signal_line": features["signal_line"]
    }], columns=FEATURES)

    predicted_growth = float(model.predict(x_input)[0])

    return {
        "symbol": symbol,
        "predicted_growth_percent": round(predicted_growth, 2)
    }
