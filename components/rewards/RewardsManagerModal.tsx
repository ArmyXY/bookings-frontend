"use client";

import React, { useState, useEffect } from "react";
import { createReward, getBusinessRewards } from "@/lib/api";
import type { Reward } from "@/lib/types";
import type { CreateRewardDto } from "@/lib/api";

interface RewardsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RewardsManagerModal({ isOpen, onClose }: RewardsManagerModalProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<CreateRewardDto>({
    name: "",
    description: "",
    costPoints: 100,
  });

  useEffect(() => {
    if (isOpen) {
      fetchRewards();
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await getBusinessRewards();
      setRewards(data);
    } catch (err) {
      console.error("Error fetching rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "costPoints" ? Math.max(1, Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await createReward(formData);
      setSuccess(`Premio "${formData.name}" creado correctamente.`);
      setFormData({ name: "", description: "", costPoints: 100 });
      fetchRewards();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Error al crear el premio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 9999, padding: "20px",
      }}
    >
      <div style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xl)",
        width: "100%", maxWidth: "520px",
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "page-in 300ms var(--ease-out-expo)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1.5px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Gestionar Premios</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Crea premios y gestiona los existentes</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", display: "grid", placeItems: "center", borderRadius: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px" }}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Nuevo Premio</h3>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: "8px", color: "#FF3B30", fontSize: "13px", fontWeight: 600 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "10px 14px", background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)", borderRadius: "8px", color: "#34C759", fontSize: "13px", fontWeight: 600 }}>
                {success}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Nombre del Premio</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} placeholder="Ej. Café gratis" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Descripción</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Descripción del premio para el cliente..." />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Precio en Puntos</label>
              <input type="number" name="costPoints" value={formData.costPoints} onChange={handleChange} min="1" required style={inputStyle} placeholder="100" />
            </div>

            <button type="submit" disabled={isSubmitting} style={{
              padding: "12px", borderRadius: "8px", border: "none",
              background: "var(--primary)", color: "black", fontWeight: 700, fontSize: "14px",
              cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}>
              {isSubmitting ? "Creando..." : "Crear Premio"}
            </button>
          </form>

          {/* Existing Rewards */}
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Premios Existentes ({rewards.length})
            </h3>
            {loading ? (
              <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>Cargando...</p>
            ) : rewards.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                <p style={{ margin: 0, fontSize: "13px" }}>Aún no has creado ningún premio.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rewards.map(reward => (
                  <div key={reward.id} style={{
                    padding: "14px 16px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    background: "var(--surface-2)",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700 }}>{reward.name}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>{reward.description}</p>
                    </div>
                    <span style={{
                      flexShrink: 0,
                      background: "rgba(212,255,0,0.12)", color: "var(--primary)",
                      padding: "4px 10px", borderRadius: "20px",
                      fontSize: "12px", fontWeight: 800,
                    }}>
                      {reward.costPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

