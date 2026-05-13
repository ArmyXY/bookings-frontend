"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function Header() {
<<<<<<< HEAD
  return (
    <header
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "20px 24px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "28px" }}>Panel de administracion</h1>
      <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
        Plataforma de gestion de reservas y cobros
      </p>
    </header>
  );
}
=======
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
>>>>>>> feature/tema
