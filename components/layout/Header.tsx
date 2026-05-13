"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-header__title">Bookings Admin</h1>
        <p className="admin-header__subtitle">
          Plataforma de gestión de reservas y cobros
        </p>
      </div>

      <div className="admin-header__actions">
        <button 
          onClick={toggleTheme}
          className="secondary-btn"
          style={{ 
            display: "grid", 
            placeItems: "center", 
            width: "40px",
            height: "40px",
            padding: 0,
            fontSize: "20px",
            borderRadius: "50%"
          }}
          title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <div className="admin-avatar">A</div>
      </div>
    </header>
  );
}