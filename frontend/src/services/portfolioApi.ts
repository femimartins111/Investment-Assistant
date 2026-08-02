import type {
  PortfolioStock,
  PortfolioSummary,
  PredictionResult,
  StockHistory,
} from "../types/portfolio";

// Point this at your running FastAPI backend. Override it with a
// .env file (VITE_API_BASE_URL=http://localhost:8000) if your backend
// runs somewhere other than the default.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function parseErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Uploads a portfolio CSV to the backend. The backend parses it,
 * enriches it with live yfinance data, computes profit/loss, and
 * returns the finished PortfolioStock[] -- this is the source of
 * truth, not the client-side CSV parser in components/csvupload.ts.
 */
export async function uploadPortfolio(file: File, userId: string): Promise<PortfolioStock[]> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const response = await fetch(`${API_BASE_URL}/api/portfolio/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to upload portfolio."));
  }

  return response.json();
}

export async function getPortfolio(userId: string): Promise<PortfolioStock[]> {
  const response = await fetch(`${API_BASE_URL}/api/portfolio/${encodeURIComponent(userId)}`);

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to load portfolio."));
  }

  return response.json();
}

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/portfolio/summary/${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to load portfolio summary."));
  }

  return response.json();
}

export async function getPrediction(symbol: string): Promise<PredictionResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/stocks/predict/${encodeURIComponent(symbol)}`
  );

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to get a prediction."));
  }

  return response.json();
}

export async function getStockHistory(symbol: string, days = 90): Promise<StockHistory> {
  const response = await fetch(
    `${API_BASE_URL}/api/stocks/history/${encodeURIComponent(symbol)}?days=${days}`
  );

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Failed to load price history."));
  }

  return response.json();
}
