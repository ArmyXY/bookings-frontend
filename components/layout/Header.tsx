"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import NotificationDropdown from "./NotificationDropdown";
import UserMenu from "./UserMenu";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isBusiness = user?.role === "business";

  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-header__title" style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>
          {isAdmin ? "Centro de Operaciones" : isBusiness ? "Area de negocio" : "Area de usuario"}
        </h1>
        <p className="admin-header__subtitle" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginTop: "2px" }}>
          {isAdmin ? "Panel de Control Administrativo" : isBusiness ? "Reservas y actividad reciente" : "Reservas y comercios disponibles"}
        </p>
      </div>

      <div className="admin-header__actions" style={{ display: "flex", alignItems: "center", gap: "24px", overflow: "visible" }}>
        {isAdmin || isBusiness ? <NotificationDropdown /> : null}
        
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{
            display: "grid",
            placeItems: "center",
            width: "42px",
            height: "42px",
            padding: 0,
            borderRadius: "12px",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
        >
          {theme === "light" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
        <div style={{ width: "1px", height: "24px", background: "var(--border)" }}></div>
        <UserMenu />
      </div>
    </header>
  );
}
