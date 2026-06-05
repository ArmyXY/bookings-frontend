"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Configuración</h2>
          <p>Ajustes generales de la aplicación y preferencias de usuario.</p>
        </div>
      </section>

      <section className="section-card page-transition">
        <div style={{ maxWidth: "800px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Preferencias de Notificaciones
            </h3>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "var(--radius-md)", background: "var(--surface-2)", marginBottom: "12px" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>Notificaciones de escritorio</p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Recibir alertas cuando se cree una nueva reserva.</p>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                style={{
                  width: "48px",
                  height: "26px",
                  borderRadius: "100px",
                  background: notifications ? "var(--primary)" : "var(--border)",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: "3px",
                  left: notifications ? "25px" : "3px",
                  transition: "all 0.3s ease"
                }}></div>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Privacidad y Seguridad
            </h3>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "var(--radius-md)", background: "var(--surface-2)", marginBottom: "12px" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>Guardado automático</p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Sincronizar cambios en la base de datos instantáneamente.</p>
              </div>
              <button 
                onClick={() => setAutoSave(!autoSave)}
                style={{
                  width: "48px",
                  height: "26px",
                  borderRadius: "100px",
                  background: autoSave ? "var(--primary)" : "var(--border)",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: "3px",
                  left: autoSave ? "25px" : "3px",
                  transition: "all 0.3s ease"
                }}></div>
              </button>
            </div>
          </div>

          <div style={{ paddingTop: "20px", borderTop: "1.5px solid var(--border)" }}>
            <button className="primary-btn">Guardar Preferencias</button>
          </div>
        </div>
      </section>
    </div>
  );
}
