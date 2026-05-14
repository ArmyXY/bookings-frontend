"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      localStorage.setItem("auth_token", "demo_token_123");
      localStorage.setItem("user_data", JSON.stringify({ name: "Alvaro", role: "Admin" }));
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "var(--bg)",
      padding: "20px"
    }}>
      <div className="section-card" style={{ 
        width: "100%", 
        maxWidth: "400px", 
        padding: "48px",
        boxShadow: "var(--shadow-lg)",
        animation: "page-in 0.6s var(--ease-out-expo)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ 
            display: "inline-grid", 
            placeItems: "center", 
            width: "64px", 
            height: "64px", 
            background: "rgba(212, 255, 0, 0.1)", 
            borderRadius: "16px",
            border: "2px solid var(--primary)",
            marginBottom: "24px"
          }}>
            <h2 style={{ margin: 0, color: "var(--text)", fontSize: "24px" }}>BF</h2>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Bienvenido de nuevo</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>Ingresa tus credenciales para acceder</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Email
            </label>
            <input 
              className="input" 
              type="email" 
              placeholder="ejemplo@correo.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Contraseña
            </label>
            <input 
              className="input" 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="primary-btn" 
            style={{ width: "100%", height: "52px", marginTop: "12px" }}
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <div className="spinner spinner--sm" style={{ borderTopColor: "black" }}></div>
                <span>Iniciando...</span>
              </div>
            ) : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            ¿No tienes cuenta? <span style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>Contacta soporte</span>
          </p>
        </div>
      </div>
    </div>
  );
}
