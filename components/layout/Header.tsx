"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-header__title">Bookings Admin</h1>
        <p className="admin-header__subtitle">
          Plataforma de gestion de reservas y cobros
        </p>
      </div>

      <div className="admin-header__actions">
        <button
          onClick={toggleTheme}
          className="secondary-btn theme-toggle"
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          type="button"
        >
          {theme === "light" ? "◐" : "○"}
        </button>
        <div className="admin-avatar">A</div>
      </div>
    </header>
  );
}
