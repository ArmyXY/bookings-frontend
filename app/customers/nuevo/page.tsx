"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { markPostLoginShutter } from "@/components/layout/PostLoginShutter";
import { useGsapButtons } from "@/hooks/useGsapButtons";

export default function RegisterCustomerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { isAuthenticated, isLoading, setSession, user } = useAuth();
  useGsapButtons();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace("/bookings");
    }
  }, [isAuthenticated, isLoading, router, user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role: "client"
      });
      setSession(response.accessToken, response.user);
      markPostLoginShutter();
      router.replace("/bookings");
    } catch {
      setErrorMessage("No se pudo crear la cuenta. Verifica que el correo no esté en uso o que el servidor esté disponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        padding: "20px",
      }}
    >
      <div
        className="section-card"
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "48px",
          boxShadow: "var(--shadow-lg)",
          animation: "page-in 0.6s var(--ease-out-expo)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: "64px",
              height: "64px",
              background: "rgba(212, 255, 0, 0.1)",
              borderRadius: "16px",
              border: "2px solid var(--primary)",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ margin: 0, color: "var(--text)", fontSize: "24px" }}>BF</h2>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>
            Crea tu cuenta
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
            Regístrate para reservar citas.
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Nombre
            </label>
            <input
              className="input"
              type="text"
              placeholder="Tu nombre completo"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Teléfono (opcional)
            </label>
            <input
              className="input"
              type="tel"
              placeholder="+34 600 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Contraseña
            </label>
            <input
              className="input"
              type="password"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

          <button
            type="submit"
            className="primary-btn"
            style={{ width: "100%", height: "52px", marginTop: "12px", justifyContent: "center" }}
            disabled={loading || isLoading}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <div className="spinner spinner--sm" style={{ borderTopColor: "black" }}></div>
                <span>Registrando...</span>
              </div>
            ) : (
              "Crear cuenta"
            )}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => router.push("/login")}
          >
            Volver a inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
}
