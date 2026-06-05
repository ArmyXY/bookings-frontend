"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { markPostLoginShutter } from "@/components/layout/PostLoginShutter";
import { useGsapButtons } from "@/hooks/useGsapButtons";
import alizarLogo from "@/app/Alizar.png";

function getHomePath(user: { isClient: boolean; role?: string }) {
  if (user.role === "admin") return "/dashboard";
  if (user.role === "business") return "/bookings";
  return "/bookings";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { isAuthenticated, isLoading, setSession, user } = useAuth();
  useGsapButtons();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getHomePath(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await login(email.trim(), password);
      setSession(response.accessToken, response.user);
      markPostLoginShutter();
      router.replace(getHomePath(response.user));
    } catch {
      setErrorMessage("Correo o contraseña incorrectos.");
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
              width: "150px",
              height: "90px",
              background: "#111111",
              borderRadius: "16px",
              border: "2px solid var(--primary)",
              marginBottom: "24px",
              padding: "0px",
            }}
          >
            <Image
              src={alizarLogo}
              alt="AliZar"
              priority
              style={{
                width: "130px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
            Accede como administrador, negocio o cliente.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="admin@demo.com"
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
                <span>Iniciando...</span>
              </div>
            ) : (
              "Iniciar sesión"
            )}
          </button>
          <button
            type="button"
            className="secondary-btn"
            style={{ 
              background: "#111111", 
              color: "white", 
              border: "none", 
              width: "100%", 
              height: "52px" 
            }}
            onClick={() => router.push("/customers/nuevo")}
          >
            Nuevo usuario
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
            Admin: admin@demo.com / admin123
            <br />
            Negocio: manager1@demo.com / manager123
            <br />
            Cliente: cliente1@mail.com / cliente123
          </p>
        </div>
      </div>
    </div>
  );
}
