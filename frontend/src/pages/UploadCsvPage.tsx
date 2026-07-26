import { ChangeEvent, useState } from "react";
import CsvRulesModal from "../components/CsvRulesModal";
import { parsePortfolioCsv, savePortfolioToLocalStorage } from "../components/csvupload";
import { uploadPortfolio } from "../services/portfolioApi";
import type { PortfolioStock } from "../types/portfolio";

interface UploadCsvPageProps {
  username: string;
  onUploadComplete: (stocks: PortfolioStock[]) => void;
  onBack: () => void;
}

export default function UploadCsvPage({ username, onUploadComplete, onBack }: UploadCsvPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrors([]);
    setWarnings([]);
    setSuccessMessage("");
  }

  async function handleUpload(): Promise<void> {
    if (!selectedFile) {
      setErrors(["Choose a CSV file first."]);
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setWarnings([]);
    setSuccessMessage("");

    // First choice: send the file to the backend. It parses the CSV,
    // pulls live price/sector/industry from yfinance, and computes
    // profit/loss -- this is the real data the dashboard should show.
    try {
      const stocks = await uploadPortfolio(selectedFile, username);
      savePortfolioToLocalStorage(username, stocks);
      setSuccessMessage(`Uploaded ${stocks.length} stock(s) from the backend.`);
      onUploadComplete(stocks);
      return;
    } catch (backendError) {
      // Backend not reachable (or it rejected the file, e.g. bad
      // ticker column). Fall back to a local, client-only parse so
      // the demo still works without a running backend. Note this
      // path can't fetch current prices, so profit/loss will be
      // blank until the backend is available.
      setWarnings([
        backendError instanceof Error && backendError.message
          ? `Backend upload failed (${backendError.message}). Showing a local preview instead.`
          : "Backend is not running. Showing a local preview instead.",
      ]);
    }

    try {
      const result = await parsePortfolioCsv(selectedFile);

      if (!result.validation.isValid) {
        setErrors(result.validation.errors);
        setWarnings((existing) => [...existing, ...result.validation.warnings]);
        return;
      }

      savePortfolioToLocalStorage(username, result.stocks);
      setWarnings((existing) => [...existing, ...result.validation.warnings]);
      setSuccessMessage(`Loaded ${result.stocks.length} stock(s) locally (backend unavailable).`);
      onUploadComplete(result.stocks);
    } catch {
      setErrors(["Something went wrong while reading the CSV file."]);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="page-shell">
      <CsvRulesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <section className="upload-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">CSV upload</p>
            <h1>Upload your portfolio</h1>
          </div>
          <button className="secondary-button" type="button" onClick={() => setIsModalOpen(true)}>
            View Rules
          </button>
        </div>

        <p className="muted-text">
          Use this page to upload a CSV with columns like
          <code> Company,ticker,amount_invested,purchase_date</code>.
        </p>

        <div className="upload-dropzone">
          <input id="portfolio-csv" type="file" accept=".csv" onChange={handleFileChange} />
          <label htmlFor="portfolio-csv">
            {selectedFile ? selectedFile.name : "Choose your portfolio CSV"}
          </label>
        </div>

        {errors.length > 0 && (
          <div className="message-box error-box">
            <strong>Fix these before uploading:</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="message-box warning-box">
            <strong>Warnings:</strong>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && <p className="success-text">{successMessage}</p>}

        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onBack}>
            Back
          </button>
          <button className="primary-button" type="button" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </section>
    </main>
  );
}
