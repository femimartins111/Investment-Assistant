import { useMemo, useState } from "react";
import PortfolioTable from "../components/PortfolioTable";
import PredictionCard from "../components/PredictionCard";
import SummaryCards from "../components/SummaryCards";
import { calculatePortfolioSummary, savePortfolioToLocalStorage } from "../components/csvupload";
import { getPortfolio } from "../services/portfolioApi";
import type { PortfolioStock } from "../types/portfolio";

interface DashboardPageProps {
  username: string;
  stocks: PortfolioStock[];
  onPortfolioUpdate: (stocks: PortfolioStock[]) => void;
  onUploadClick: () => void;
}

export default function DashboardPage({
  username,
  stocks,
  onPortfolioUpdate,
  onUploadClick,
}: DashboardPageProps) {
  const [selectedTicker, setSelectedTicker] = useState(stocks[0]?.ticker ?? "");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  const summary = useMemo(() => calculatePortfolioSummary(stocks), [stocks]);

  async function handleBackendRefresh(): Promise<void> {
    setIsRefreshing(true);
    setRefreshMessage("");

    try {
      const backendStocks = await getPortfolio(username);
      onPortfolioUpdate(backendStocks);
      savePortfolioToLocalStorage(username, backendStocks);
      setSelectedTicker(backendStocks[0]?.ticker ?? "");
      setRefreshMessage("Portfolio refreshed from backend.");
    } catch {
      setRefreshMessage(
        "Backend is not running yet. Local CSV data is still available for the frontend demo."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{username}'s portfolio</h1>
          <p className="muted-text">
            Local CSV upload works now. Backend refresh and ML prediction will work when your API
            routes are connected to the Python files.
          </p>
        </div>

        <div className="button-row wrap-buttons">
          <button className="secondary-button" type="button" onClick={onUploadClick}>
            Upload New CSV
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={handleBackendRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh From Backend"}
          </button>
        </div>
      </section>

      {refreshMessage && <p className="info-banner">{refreshMessage}</p>}

      <SummaryCards summary={summary} />

      <div className="dashboard-grid">
        <PortfolioTable
          stocks={stocks}
          selectedTicker={selectedTicker}
          onSelectTicker={setSelectedTicker}
        />
        <PredictionCard selectedTicker={selectedTicker} />
      </div>
    </main>
  );
}
