import type { PortfolioSummary } from "../types/portfolio";
import { formatCurrency, formatPercent, signClass } from "../utils/format";

interface SummaryCardsProps {
  summary: PortfolioSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="summary-grid">
      <div className="summary-card">
        <span>Total Invested</span>
        <strong>{formatCurrency(summary.total_invested)}</strong>
      </div>

      <div className="summary-card">
        <span>Current Value</span>
        <strong>{formatCurrency(summary.current_value)}</strong>
      </div>

      <div className="summary-card">
        <span>Total Profit / Loss</span>
        <strong className={signClass(summary.total_profit_loss)}>
          {formatCurrency(summary.total_profit_loss)}
        </strong>
      </div>

      <div className="summary-card">
        <span>Return</span>
        <strong className={signClass(summary.return_percent)}>
          {formatPercent(summary.return_percent)}
        </strong>
      </div>
    </div>
  );
}
