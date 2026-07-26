interface CsvRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CsvRulesModal({ isOpen, onClose }: CsvRulesModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>CSV format rules</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <p className="muted-text">
          Your CSV's first column is the company name. The columns below can appear in any order
          after that.
        </p>

        <div className="rules-box">
          <p className="rules-title">Required columns</p>
          <ul>
            <li>
              <code>ticker</code> &mdash; the stock symbol, e.g. AAPL
            </li>
            <li>
              <code>amount_invested</code> &mdash; how much you put in, e.g. 5000
            </li>
          </ul>
        </div>

        <div className="rules-box">
          <p className="rules-title">Recommended columns</p>
          <ul>
            <li>
              <code>purchase_date</code> (or <code>buy_date</code>) &mdash; format YYYY-MM-DD.
              Needed to calculate profit/loss.
            </li>
          </ul>
        </div>

        <div className="rules-box">
          <p className="rules-title">Example row</p>
          <ul>
            <li>
              <code>Apple,AAPL,5000,2024-01-15</code>
            </li>
          </ul>
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
