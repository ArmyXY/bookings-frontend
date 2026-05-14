"use client";

import React from "react";

export default function ProfilePage() {
  const user = {
    name: "Alvaro",
    email: "alvaro@example.com",
    role: "Administrador",
    joinDate: "2026-01-15",
    initials: "AL"
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Perfil de Usuario</h2>
          <p>Gestiona tu información personal y preferencias de cuenta.</p>
        </div>
      </section>

      <section className="section-card page-transition">
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          padding: "40px 0",
          borderBottom: "1.5px solid var(--border)",
          marginBottom: "32px"
        }}>
          <div style={{ 
            width: "120px", 
            height: "120px", 
            borderRadius: "50%", 
            background: "var(--surface-2)",
            display: "grid",
            placeItems: "center",
            fontSize: "42px",
            fontWeight: 800,
            color: "var(--primary)",
            border: "4px solid var(--border)",
            marginBottom: "20px",
            boxShadow: "var(--shadow-lg)"
          }}>
            {user.initials}
          </div>
          <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800 }}>{user.name}</h3>
          <p style={{ margin: "4px 0 0", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.1em" }}>
            {user.role}
          </p>
        </div>

        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ padding: "12px 0" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Nombre completo
              </label>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{user.name}</p>
            </div>
            
            <div style={{ padding: "12px 0" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Correo electrónico
              </label>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{user.email}</p>
            </div>

            <div style={{ padding: "12px 0" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Fecha de registro
              </label>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                {new Date(user.joinDate).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div style={{ marginTop: "40px", padding: "24px", background: "rgba(212, 255, 0, 0.03)", borderRadius: "var(--radius-md)", border: "1px dashed var(--primary)" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 800 }}>Seguridad de la cuenta</h4>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--muted)" }}>
              Tu cuenta está protegida con autenticación de dos factores. Para cambiar tu contraseña, contacta con el administrador del sistema.
            </p>
            <button className="secondary-btn" disabled style={{ opacity: 0.5 }}>
              Cambiar contraseña
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
