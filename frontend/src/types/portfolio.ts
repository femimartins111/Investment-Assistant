export type PageName = "login" | "landing" | "upload" | "dashboard";

/**
 * Mirrors the shape returned by portfolio_dict_to_list() in main.py
 * (used by /api/portfolio/upload and /api/portfolio/{user_id}).
 */
export interface PortfolioStock {
  company: string;
  ticker: string;
  amount_invested: number | null;
  purchase_date: string | null;
  current_price: number | null;
  sector: string;
  industry: string;
  up_shares: number | null;
  profit_loss: number | null;
}

/**
 * Mirrors the shape returned by /api/portfolio/summary/{user_id}.
 */
export interface PortfolioSummary {
  total_invested: number | null;
  total_profit_loss: number | null;
  current_value: number | null;
  return_percent: number | null;
}

/**
 * Mirrors the shape returned by /api/stocks/predict/{symbol}.
 */
export interface PredictionResult {
  symbol: string;
  predicted_growth_percent: number;
  latest_price: number | null;
  rsi: number | null;
  rsi_interpretation: string;
  macd: number | null;
  signal_line: number | null;
  macd_interpretation: string;
}

/**
 * Mirrors the shape returned by /api/stocks/history/{symbol}.
 */
export interface StockHistoryPoint {
  date: string;
  close: number | null;
  rsi: number | null;
  macd: number | null;
  signal_line: number | null;
}

export interface StockHistory {
  symbol: string;
  history: StockHistoryPoint[];
}

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
