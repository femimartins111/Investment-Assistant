import { useState } from "react";
import { getPrediction } from "../services/portfolioApi";
import type { PredictionResult } from "../types/portfolio";
import { formatCurrency, formatPercent, signClass } from "../utils/format";

interface PredictionCardProps {
  selectedTicker: string;
}

export default function PredictionCard({ selectedTicker }: PredictionCardProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePredict(): Promise<void> {
    if (!selectedTicker) {
      return;
    }

    setIsLoading(true);
    setError("");
    setPrediction(null);

    try {
      const result = await getPrediction(selectedTicker);
      setPrediction(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the prediction service. Is the backend running?"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <aside className="prediction-card">
      <p className="eyebrow">Growth prediction</p>
      <h2>{selectedTicker || "Select a stock"}</h2>
      <p className="muted-text">
        Runs the trained model against the latest RSI and MACD indicators for this ticker.
      </p>

      <button
        className="primary-button full-width"
        type="button"
        onClick={handlePredict}
        disabled={!selectedTicker || isLoading}
      >
        {isLoading ? "Predicting..." : "Get Prediction"}
      </button>

      {error && <p className="error-text">{error}</p>}

      {prediction && (
        <div className="prediction-result">
          <span>Predicted next-day growth</span>
          <strong className={signClass(prediction.predicted_growth_percent)}>
            {formatPercent(prediction.predicted_growth_percent)}
          </strong>

          <span>Latest price</span>
          <strong>{formatCurrency(prediction.latest_price)}</strong>

          <span>RSI ({prediction.rsi ?? "—"})</span>
          <strong>{prediction.rsi_interpretation}</strong>

          <span>MACD</span>
          <strong>{prediction.macd_interpretation}</strong>
        </div>
      )}
    </aside>
  );
}
