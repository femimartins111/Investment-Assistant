import type { PortfolioStock } from "../types/portfolio";
import { formatCurrency, signClass } from "../utils/format";

interface PortfolioTableProps {
  stocks: PortfolioStock[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export default function PortfolioTable({ stocks, selectedTicker, onSelectTicker }: PortfolioTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="empty-state">
        <p className="eyebrow">Holdings</p>
        <h2>No portfolio yet</h2>
        <p className="muted-text">Upload a CSV to see your holdings here.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <p className="eyebrow">Holdings</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Ticker</th>
              <th>Amount Invested</th>
              <th>Purchase Date</th>
              <th>Current Price</th>
              <th>Sector</th>
              <th>Industry</th>
              <th>Profit / Loss</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={`${stock.company}-${stock.ticker}`}
                className={stock.ticker === selectedTicker ? "selected-row" : undefined}
                onClick={() => onSelectTicker(stock.ticker)}
              >
                <td>{stock.company}</td>
                <td>
                  <span className="pill">{stock.ticker}</span>
                </td>
                <td>{formatCurrency(stock.amount_invested)}</td>
                <td>{stock.purchase_date ?? "—"}</td>
                <td>{formatCurrency(stock.current_price)}</td>
                <td>{stock.sector}</td>
                <td>{stock.industry}</td>
                <td className={signClass(stock.profit_loss)}>
                  {stock.profit_loss === null ? "—" : formatCurrency(stock.profit_loss)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-note">
        Showing {stocks.length} holding{stocks.length === 1 ? "" : "s"}. Click a row to load its
        growth prediction.
      </p>
    </div>
  );
}
