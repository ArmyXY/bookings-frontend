"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getBusinesses, updateBusiness } from "@/lib/api";
import { Business } from "@/lib/types";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [pointsPerEuro, setPointsPerEuro] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if ((user?.role === "business" || user?.role === "admin") && user.businessId) {
        try {
          const businesses = await getBusinesses();
          const myBusiness = businesses.find(b => b.id === user.businessId);
          if (myBusiness) {
            setBusiness(myBusiness);
            setPointsPerEuro(myBusiness.pointsPerEuro ?? 1);
          }
        } catch (error) {
          console.error("Error loading business info", error);
        }
      }
    }
    loadData();
  }, [user]);

  const handleSave = async () => {
    setMessage("");
    if ((user?.role === "business" || user?.role === "admin") && business) {
      setIsLoading(true);
      try {
        await updateBusiness(business.id, { pointsPerEuro });
        setMessage("Configuración guardada correctamente");
      } catch (error: any) {
        setMessage(error.message || "Error al guardar la configuración");
      } finally {
        setIsLoading(false);
      }
    }
  };

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
          
          {(user?.role === "business" || user?.role === "admin") && (
            <div style={{ marginBottom: "40px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Sistema de Puntos
              </h3>
              
              <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--surface-2)", marginBottom: "12px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                    Puntos por Euro
                  </label>
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--muted)" }}>
                    Define cuántos puntos recibe el cliente por cada euro gastado en tu negocio. (Por defecto: 1 euro = 1 punto)
                  </p>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={pointsPerEuro}
                    onChange={(e) => setPointsPerEuro(parseFloat(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-1)",
                      color: "var(--foreground)",
                      fontSize: "16px",
                      fontWeight: 500
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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

          <div style={{ paddingTop: "20px", borderTop: "1.5px solid var(--border)" }}>
            <button 
              className="primary-btn" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar Preferencias"}
            </button>
            {message && (
              <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: 600, color: message.includes("Error") ? "var(--destructive)" : "var(--primary)" }}>
                {message}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
