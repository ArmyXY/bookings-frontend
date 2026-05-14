"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-header__title">Overview</h1>
        <p className="admin-header__subtitle">
          Welcome back to your finance dashboard
        </p>
      </div>

      <div className="admin-header__actions" style={{ gap: "40px" }}>
        
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={toggleTheme}
            className="secondary-btn"
            style={{
              display: "grid",
              placeItems: "center",
              width: "48px",
              height: "48px",
              padding: 0,
              fontSize: "22px",
              borderRadius: "50%",
              border: "1.5px solid var(--border)",
              boxShadow: "var(--shadow-sm)"
            }}
            title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
          >
            {theme === "light" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <div className="admin-avatar">JS</div>
        </div>
      </div>
    </header>
  );
}
