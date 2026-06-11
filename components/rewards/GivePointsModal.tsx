"use client";

import React, { useState, useRef } from "react";
import { addPoints, getCustomers } from "@/lib/api";
import type { Customer } from "@/lib/types";

interface GivePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GivePointsModal({ isOpen, onClose }: GivePointsModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [points, setPoints] = useState(50);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
      setSelectedCustomer(null);
      setCustomerSearch("");
      setCustomerId("");
      setPoints(50);
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerSearch(val);
    setSelectedCustomer(null);
    setCustomerId("");

    if (val.length > 0) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        c.email.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 6));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerId(String(c.id));
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const id = parseInt(customerId, 10);
    if (isNaN(id) || id <= 0) {
      setError("Selecciona un cliente válido.");
      return;
    }
    if (points <= 0) {
      setError("La cantidad de puntos debe ser mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addPoints(id, points);
      const name = selectedCustomer?.name || `Cliente #${id}`;
      setSuccess(`✓ ${points} puntos asignados a ${name} correctamente.`);
      setCustomerSearch("");
      setCustomerId("");
      setSelectedCustomer(null);
      setPoints(50);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Error al asignar puntos.");
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
        width: "100%", maxWidth: "420px",
        display: "flex", flexDirection: "column",
        overflow: "visible",
        animation: "page-in 300ms var(--ease-out-expo)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1.5px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Dar Puntos</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Asigna puntos de fidelidad a un cliente</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", display: "grid", placeItems: "center", borderRadius: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

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

            {/* Customer search */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }} ref={searchRef}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Cliente</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={handleSearchChange}
                  onFocus={() => customerSearch && setShowDropdown(true)}
                  placeholder="Busca por nombre o email..."
                  required
                  style={inputStyle}
                />
                {showDropdown && filteredCustomers.length > 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "var(--surface)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 100, overflow: "hidden",
                  }}>
                    {filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>{c.email}</p>
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown && filteredCustomers.length === 0 && customerSearch && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "var(--surface)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "13px", color: "var(--muted)",
                    zIndex: 100,
                  }}>
                    No se encontró ningún cliente.
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <p style={{ margin: 0, fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
                  ✓ {selectedCustomer.name} · {selectedCustomer.email}
                </p>
              )}
            </div>

            {/* Points */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Cantidad de Puntos</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
                min="1"
                required
                style={inputStyle}
                placeholder="50"
              />
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                Los puntos se sumarán al saldo actual del cliente.
              </p>
            </div>

            {/* Quick select */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[10, 25, 50, 100].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPoints(v)}
                  style={{
                    flex: 1, padding: "6px", borderRadius: "6px",
                    border: points === v ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                    background: points === v ? "rgba(212,255,0,0.1)" : "var(--surface-2)",
                    color: points === v ? "var(--primary)" : "var(--text)",
                    fontWeight: 700, fontSize: "12px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  +{v}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !customerId}
              style={{
                marginTop: "4px", padding: "12px", borderRadius: "8px", border: "none",
                background: "var(--primary)", color: "black", fontWeight: 700, fontSize: "14px",
                cursor: isSubmitting || !customerId ? "not-allowed" : "pointer",
                opacity: isSubmitting || !customerId ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {isSubmitting ? "Asignando..." : `Asignar ${points} Puntos`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

