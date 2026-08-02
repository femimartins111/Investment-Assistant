import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getStockHistory } from "../services/portfolioApi";
import type { StockHistoryPoint } from "../types/portfolio";

interface StockHistoryChartProps {
  ticker: string;
}

export default function StockHistoryChart({ ticker }: StockHistoryChartProps) {
  const [history, setHistory] = useState<StockHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getStockHistory(ticker)
      .then((result) => {
        if (!cancelled) {
          setHistory(result.history);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load price history.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (!ticker) {
    return null;
  }

  return (
    <div className="table-card">
      <p className="eyebrow">Price, RSI &amp; MACD &mdash; {ticker}</p>

      {isLoading && <p className="muted-text">Loading chart...</p>}
      {error && <p className="error-text">{error}</p>}

      {!isLoading && !error && history.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="close" stroke="#2457d6" dot={false} name="Close" />
            </LineChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="4 4" />
              <ReferenceLine y={30} stroke="#15803d" strokeDasharray="4 4" />
              <Tooltip />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" dot={false} name="RSI" />
            </LineChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} />
              <YAxis tick={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="macd" stroke="#2457d6" dot={false} name="MACD" />
              <Line
                type="monotone"
                dataKey="signal_line"
                stroke="#dc2626"
                dot={false}
                name="Signal"
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {!isLoading && !error && history.length === 0 && (
        <p className="muted-text">No history available for this ticker yet.</p>
      )}
    </div>
  );
}
