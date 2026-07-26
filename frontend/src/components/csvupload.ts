import type { CsvValidationResult, PortfolioStock, PortfolioSummary } from "../types/portfolio";

const REQUIRED_COLUMNS = ["ticker", "amount_invested"];
const DATE_COLUMNS = ["purchase_date", "buy_date"];

function portfolioStorageKey(username: string): string {
  return `investment_app_portfolio_${username}`;
}

/**
 * Minimal CSV line splitter that understands double-quoted fields
 * (so a quoted company name like "Smith, Jones & Co" doesn't get
 * split on its internal comma). Good enough for the simple
 * spreadsheet exports this app expects -- not a full RFC 4180 parser.
 */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

interface ParsePortfolioCsvResult {
  stocks: PortfolioStock[];
  validation: CsvValidationResult;
}

/**
 * Client-side-only CSV parsing for the offline demo path. This is
 * NOT what populates real numbers on the dashboard -- it can't call
 * yfinance, so current_price/sector/industry/profit_loss come back
 * null. The real data comes from uploadPortfolio() in portfolioApi.ts,
 * which sends the file to the backend. This function exists so the
 * upload page can validate a file and preview it even when the
 * backend isn't running.
 */
export async function parsePortfolioCsv(file: File): Promise<ParsePortfolioCsvResult> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (lines.length < 2) {
    errors.push("The CSV needs a header row plus at least one data row.");
    return { stocks: [], validation: { isValid: false, errors, warnings } };
  }

  const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const companyColumnName = header[0];

  if (!companyColumnName) {
    errors.push("The first column should be the company name.");
  }

  for (const required of REQUIRED_COLUMNS) {
    if (!header.includes(required)) {
      errors.push(`Missing required column: "${required}".`);
    }
  }

  const hasDateColumn = DATE_COLUMNS.some((column) => header.includes(column));
  if (!hasDateColumn) {
    warnings.push(
      `No "purchase_date" (or "buy_date") column found. Profit/loss won't be calculable without it.`
    );
  }

  if (errors.length > 0) {
    return { stocks: [], validation: { isValid: false, errors, warnings } };
  }

  const tickerIndex = header.indexOf("ticker");
  const amountIndex = header.indexOf("amount_invested");
  const purchaseDateIndex = header.indexOf("purchase_date");
  const buyDateIndex = header.indexOf("buy_date");
  const sectorIndex = header.indexOf("sector");
  const industryIndex = header.indexOf("industry");

  const stocks: PortfolioStock[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const cells = splitCsvLine(lines[rowIndex]);
    const company = cells[0];

    if (!company) {
      warnings.push(`Row ${rowIndex + 1} is missing a company name and was skipped.`);
      continue;
    }

    const ticker = cells[tickerIndex]?.toUpperCase();
    if (!ticker) {
      warnings.push(`Row ${rowIndex + 1} (${company}) is missing a ticker and was skipped.`);
      continue;
    }

    stocks.push({
      company,
      ticker,
      amount_invested: toNumberOrNull(cells[amountIndex]),
      purchase_date:
        (purchaseDateIndex >= 0 ? cells[purchaseDateIndex] : undefined) ||
        (buyDateIndex >= 0 ? cells[buyDateIndex] : undefined) ||
        null,
      current_price: null,
      sector: sectorIndex >= 0 ? cells[sectorIndex] || "Unknown" : "Unknown",
      industry: industryIndex >= 0 ? cells[industryIndex] || "Unknown" : "Unknown",
      up_shares: null,
      profit_loss: null,
    });
  }

  if (stocks.length === 0) {
    errors.push("No valid rows were found in the CSV.");
  }

  return {
    stocks,
    validation: { isValid: errors.length === 0, errors, warnings },
  };
}

export function calculatePortfolioSummary(stocks: PortfolioStock[]): PortfolioSummary {
  if (stocks.length === 0) {
    return {
      total_invested: 0,
      total_profit_loss: 0,
      current_value: 0,
      return_percent: 0,
    };
  }

  const totalInvested = stocks.reduce((sum, stock) => sum + (stock.amount_invested ?? 0), 0);
  const totalProfitLoss = stocks.reduce((sum, stock) => sum + (stock.profit_loss ?? 0), 0);

  return {
    total_invested: totalInvested,
    total_profit_loss: totalProfitLoss,
    current_value: totalInvested + totalProfitLoss,
    return_percent: totalInvested ? (totalProfitLoss / totalInvested) * 100 : 0,
  };
}

export function savePortfolioToLocalStorage(username: string, stocks: PortfolioStock[]): void {
  localStorage.setItem(portfolioStorageKey(username), JSON.stringify(stocks));
}

export function loadPortfolioFromLocalStorage(username: string): PortfolioStock[] {
  const raw = localStorage.getItem(portfolioStorageKey(username));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
