import { useEffect, useState } from "react";
import Header from "./components/Header";
import { loadPortfolioFromLocalStorage } from "./components/csvupload";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import UploadCsvPage from "./pages/UploadCsvPage";
import type { PageName, PortfolioStock } from "./types/portfolio";
import "./App.css";

const USER_STORAGE_KEY = "investment_app_username";

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem(USER_STORAGE_KEY) ?? "");
  const [currentPage, setCurrentPage] = useState<PageName>(() =>
    localStorage.getItem(USER_STORAGE_KEY) ? "landing" : "login"
  );
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>(() =>
    username ? loadPortfolioFromLocalStorage(username) : []
  );

  useEffect(() => {
    if (username) {
      setPortfolio(loadPortfolioFromLocalStorage(username));
    }
  }, [username]);

  function handleLogin(nextUsername: string): void {
    localStorage.setItem(USER_STORAGE_KEY, nextUsername);
    setUsername(nextUsername);
    setCurrentPage("landing");
  }

  function handleLogout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUsername("");
    setPortfolio([]);
    setCurrentPage("login");
  }

  function handleUploadComplete(stocks: PortfolioStock[]): void {
    setPortfolio(stocks);
    setCurrentPage("dashboard");
  }

  if (currentPage === "login" || !username) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Header
        username={username}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />

      {currentPage === "landing" && (
        <LandingPage
          username={username}
          hasPortfolio={portfolio.length > 0}
          onUploadClick={() => setCurrentPage("upload")}
          onDashboardClick={() => setCurrentPage("dashboard")}
          onLoginBack={handleLogout}
        />
      )}

      {currentPage === "upload" && (
        <UploadCsvPage
          username={username}
          onUploadComplete={handleUploadComplete}
          onBack={() => setCurrentPage("landing")}
        />
      )}

      {currentPage === "dashboard" && (
        <DashboardPage
          username={username}
          stocks={portfolio}
          onPortfolioUpdate={setPortfolio}
          onUploadClick={() => setCurrentPage("upload")}
        />
      )}
    </div>
  );
}

export default App;
