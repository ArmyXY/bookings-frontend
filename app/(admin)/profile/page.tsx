"use client";

import React from "react";
import { useAuth } from "@/components/providers/AuthProvider";

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getRoleLabel(role?: string) {
  if (role === "admin") return "Administrador";
  if (role === "business") return "Negocio";
  if (role === "client") return "Cliente";
  return "Sin rol";
}

function getRoleDescription(role?: string) {
  if (role === "admin") return "Administrador: acceso completo al sistema";
  if (role === "business") return "Negocio: gestion de sus reservas";
  if (role === "client") return "Cliente: reservas propias y comercios";
  return "Rol no reconocido";
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Perfil de Usuario</h2>
          <p>Gestiona tu informacion personal y preferencias de cuenta.</p>
        </div>
      </section>

      <section className="section-card page-transition">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 0",
            borderBottom: "1.5px solid var(--border)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
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
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {getInitials(user?.name)}
          </div>
          <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800 }}>{user?.name}</h3>
          <p style={{ margin: "4px 0 0", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.1em" }}>
            {getRoleLabel(user?.role)}
          </p>
        </div>

        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ padding: "12px 0" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Nombre completo
              </label>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{user?.name}</p>
            </div>

            <div style={{ padding: "12px 0" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Correo electronico
              </label>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{user?.email}</p>
            </div>

            <div style={{ padding: "12px 0" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Tipo de acceso
              </label>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                {getRoleDescription(user?.role)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
