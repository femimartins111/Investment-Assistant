import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

def train_stock_model(df):
    df = df.copy()

    # Target: next-day percentage growth
    df["target"] = (
        (df["close"].shift(-1) - df["close"])
        / df["close"]
    ) * 100

    # Remove rows with missing values
    df = df.dropna()

    features = [
        "open",
        "high",
        "low",
        "close",
        "volume",
        "rsi",
        "macd",
        "signal_line"
    ]

    X = df[features]
    y = df["target"]

    # No shuffle because stock data is time-series
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        shuffle=False
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        random_state=42
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    print("MAE (% Growth):", mean_absolute_error(y_test, predictions))
    print("R2 Score:", r2_score(y_test, predictions))

    joblib.dump(model, "stock_prediction_model.pkl")

    return model