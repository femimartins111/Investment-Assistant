interface LandingPageProps {
  username: string;
  hasPortfolio: boolean;
  onUploadClick: () => void;
  onDashboardClick: () => void;
  onLoginBack: () => void;
}

export default function LandingPage({
  username,
  hasPortfolio,
  onUploadClick,
  onDashboardClick,
  onLoginBack,
}: LandingPageProps) {
  return (
    <main className="landing-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Investment portfolio helper</p>
          <h1>Welcome to your Investment App, {username}</h1>
          <p>
            Upload a portfolio CSV, check your holdings, review your current valuation, and connect
            your Python ML model for growth predictions.
          </p>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={onUploadClick}>
              Upload CSV
            </button>
            <button className="secondary-button" type="button" onClick={onLoginBack}>
              Login Back
            </button>
            {hasPortfolio && (
              <button className="secondary-button" type="button" onClick={onDashboardClick}>
                View Dashboard
              </button>
            )}
          </div>
        </div>

        <aside className="hero-panel">
          <h2>What this app does</h2>
          <ul>
            <li>Checks that your CSV has the correct columns.</li>
            <li>Stores the uploaded portfolio locally for the demo.</li>
            <li>Displays total invested, current value, and return.</li>
            <li>Prepares the frontend for RSI, MACD, and ML prediction results.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
