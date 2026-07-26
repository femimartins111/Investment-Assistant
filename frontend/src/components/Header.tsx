import type { PageName } from "../types/portfolio";

interface HeaderProps {
  username: string;
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { page: PageName; label: string }[] = [
  { page: "landing", label: "Home" },
  { page: "upload", label: "Upload CSV" },
  { page: "dashboard", label: "Dashboard" },
];

export default function Header({ username, currentPage, onNavigate, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <button className="brand-button" type="button" onClick={() => onNavigate("landing")}>
        Investment App
      </button>

      <nav className="header-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`nav-link${currentPage === item.page ? " active" : ""}`}
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-user">
        <span>{username}</span>
        <button className="secondary-button small-button" type="button" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}
