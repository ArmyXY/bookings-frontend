"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import NotificationDropdown from "./NotificationDropdown";
import UserMenu from "./UserMenu";

// ─── Types ────────────────────────────────────────────────────────────────────
type Reward = {
  id: number; name: string; description: string;
  pointsCost: number; businessId: number;
};
type CustomerPoints = { id: number; customerId: number; points: number };
type RedeemedReward = { id: number; rewardId: number; redeemedAt: string; reward?: Reward };
type Customer = { id: number; name: string; email: string };

// ─── API helpers ──────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") ?? "" : ""; }
async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store", ...opts,
    headers: {
      ...(opts?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text() || `Error ${path}`);
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}
const api = {
  createReward: (data: { name: string; description: string; pointsCost: number; expiresAt: string }) =>
    req<Reward>("/rewards/business", { method: "POST", body: JSON.stringify(data) }),
  getBusinessRewards: () => req<Reward[]>("/rewards"),
  addPoints: (customerId: number, points: number) =>
    req<void>("/rewards/points", { method: "POST", body: JSON.stringify({ customerId, points }) }),
  getCustomers: () => req<Customer[]>("/customers"),
  getBusinesses: () => req<{ id: number; name: string }[]>("/businesses"),
  getRewardsByBusiness: (id: number) => req<Reward[]>(`/rewards/business/${id}`),
  getCustomerPoints: () => req<CustomerPoints>("/rewards/points"),
  redeemReward: (id: number) => req<RedeemedReward>(`/rewards/${id}/redeem`, { method: "POST" }),
  getMyRedeemedRewards: () => req<RedeemedReward[]>("/rewards/my-rewards"),
};

// ─── Shared ───────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: "8px",
  border: "1.5px solid var(--border)", background: "var(--surface-2)",
  color: "var(--text)", fontSize: "14px", outline: "none",
  width: "100%", boxSizing: "border-box",
};
function Alert({ msg, type }: { msg: string; type: "error" | "success" }) {
  return (
    <div style={{
      padding: "10px 14px",
      background: type === "error" ? "rgba(255,59,48,0.1)" : "rgba(52,199,89,0.1)",
      border: `1px solid ${type === "error" ? "rgba(255,59,48,0.3)" : "rgba(52,199,89,0.3)"}`,
      borderRadius: "8px", color: type === "error" ? "#FF3B30" : "#34C759",
      fontSize: "13px", fontWeight: 600,
    }}>{msg}</div>
  );
}
function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", display: "grid", placeItems: "center", borderRadius: "8px" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "20px",
    }}>
      {children}
    </div>
  );
}

// ─── Modal: Gestionar Premios (Manager) ───────────────────────────────────────
function RewardsManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", description: "", pointsCost: 100, expiresAt: "" });

  useEffect(() => { if (isOpen) { setError(""); setSuccess(""); fetchRewards(); } }, [isOpen]);

  const fetchRewards = async () => {
    setLoading(true);
    try { setRewards(await api.getBusinessRewards()); } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === "pointsCost" ? Math.max(1, Number(value)) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setSubmitting(true);
    try {
      await api.createReward(form);
      setSuccess(`Premio "${form.name}" creado correctamente.`);
      setForm({ name: "", description: "", pointsCost: 100, expiresAt: "" });
      fetchRewards();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) { setError(err.message || "Error al crear el premio."); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: "520px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", animation: "page-in 300ms var(--ease-out-expo)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Gestionar Premios</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Crea premios y gestiona los existentes</p>
          </div>
          <CloseBtn onClose={onClose} />
        </div>
        <div style={{ overflowY: "auto", padding: "24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Nuevo Premio</h3>
            {error && <Alert msg={error} type="error" />}
            {success && <Alert msg={success} type="success" />}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Nombre del Premio</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="Ej. Café gratis" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} required style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Descripción del premio para el cliente..." />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Precio en Puntos</label>
              <input type="number" name="pointsCost" value={form.pointsCost} onChange={handleChange} min="1" required style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Fecha de Validez</label>
              <input type="date" name="expiresAt" value={form.expiresAt} onChange={handleChange} required style={inputStyle} />
            </div>
            <button type="submit" disabled={submitting} style={{ padding: "12px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "black", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Creando..." : "Crear Premio"}
            </button>
          </form>
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Premios Existentes ({rewards.length})</h3>
            {loading ? <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>Cargando...</p> : rewards.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                <p style={{ margin: 0, fontSize: "13px" }}>Aún no has creado ningún premio.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rewards.map(r => (
                  <div key={r.id} style={{ padding: "14px 16px", border: "1.5px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700 }}>{r.name}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>{r.description}</p>
                      {(r as any).expiresAt && (
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#FF3B30", fontWeight: 600 }}>
                          Válido hasta: {(r as any).expiresAt}
                        </p>
                      )}
                    </div>
                    <span style={{ flexShrink: 0, background: "rgba(212,255,0,0.12)", color: "var(--primary)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>{r.pointsCost} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Modal: Dar Puntos (Manager) ──────────────────────────────────────────────
function GivePointsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState(""); const [points, setPoints] = useState(50);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showDrop, setShowDrop] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) { setError(""); setSuccess(""); setSearch(""); setSelected(null); setPoints(50); api.getCustomers().then(setCustomers).catch(() => {}); }
  }, [isOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setSearch(v); setSelected(null);
    if (v.length > 0) { setFiltered(customers.filter(c => c.name.toLowerCase().includes(v.toLowerCase()) || c.email.toLowerCase().includes(v.toLowerCase())).slice(0, 6)); setShowDrop(true); }
    else setShowDrop(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!selected) { setError("Selecciona un cliente válido."); return; }
    if (points <= 0) { setError("La cantidad de puntos debe ser mayor a 0."); return; }
    setSubmitting(true);
    try {
      await api.addPoints(selected.id, points);
      setSuccess(`✓ ${points} puntos asignados a ${selected.name} correctamente.`);
      setSearch(""); setSelected(null); setPoints(50);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) { setError(err.message || "Error al asignar puntos."); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", overflow: "visible", animation: "page-in 300ms var(--ease-out-expo)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Dar Puntos</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Asigna puntos de fidelidad a un cliente</p>
          </div>
          <CloseBtn onClose={onClose} />
        </div>
        <div style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && <Alert msg={error} type="error" />}
            {success && <Alert msg={success} type="success" />}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Cliente</label>
              <div style={{ position: "relative" }}>
                <input type="text" value={search} onChange={handleSearch} onFocus={() => search && setShowDrop(true)} placeholder="Busca por nombre o email..." style={inputStyle} />
                {showDrop && filtered.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "10px", boxShadow: "var(--shadow-lg)", zIndex: 100, overflow: "hidden" }}>
                    {filtered.map(c => (
                      <div key={c.id} onClick={() => { setSelected(c); setSearch(c.name); setShowDrop(false); }}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>{c.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selected && <p style={{ margin: 0, fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>✓ {selected.name} · {selected.email}</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Cantidad de Puntos</label>
              <input type="number" value={points} onChange={e => setPoints(Math.max(1, Number(e.target.value)))} min="1" required style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[10, 25, 50, 100].map(v => (
                <button key={v} type="button" onClick={() => setPoints(v)} style={{ flex: 1, padding: "6px", borderRadius: "6px", border: points === v ? "1.5px solid var(--primary)" : "1.5px solid var(--border)", background: points === v ? "rgba(212,255,0,0.1)" : "var(--surface-2)", color: points === v ? "var(--primary)" : "var(--text)", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>+{v}</button>
              ))}
            </div>
            <button type="submit" disabled={submitting || !selected} style={{ padding: "12px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "black", fontWeight: 700, fontSize: "14px", cursor: submitting || !selected ? "not-allowed" : "pointer", opacity: submitting || !selected ? 0.6 : 1 }}>
              {submitting ? "Asignando..." : `Asignar ${points} Puntos`}
            </button>
          </form>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Modal: Mis Recompensas (Cliente) ─────────────────────────────────────────
function ClientRewardsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [pts, setPts] = useState<CustomerPoints | null>(null);
  const [businesses, setBusinesses] = useState<{ id: number; name: string }[]>([]);
  const [bizId, setBizId] = useState("");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [history, setHistory] = useState<RedeemedReward[]>([]);
  const [loadingPts, setLoadingPts] = useState(false);
  const [loadingRew, setLoadingRew] = useState(false);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"available" | "history">("available");
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) { setError(""); setSuccess(""); setBizId(""); setRewards([]); setTab("available"); fetchAll(); }
  }, [isOpen]);

  useEffect(() => {
    if (bizId) { setLoadingRew(true); api.getRewardsByBusiness(Number(bizId)).then(setRewards).catch(() => setRewards([])).finally(() => setLoadingRew(false)); }
    else setRewards([]);
  }, [bizId]);

  const fetchAll = async () => {
    setLoadingPts(true);
    await Promise.all([
      api.getCustomerPoints().then(setPts).catch(() => setPts(null)),
      api.getBusinesses().then(setBusinesses).catch(() => {}),
      api.getMyRedeemedRewards().then(setHistory).catch(() => {}),
    ]);
    setLoadingPts(false);
  };

  const handleRedeem = async (r: Reward) => {
    const cur = pts?.points ?? 0;
    if (cur < r.pointsCost) { setError(`Te faltan ${r.pointsCost - cur} puntos para canjear "${r.name}".`); setTimeout(() => setError(""), 4000); return; }
    setRedeemingId(r.id); setError("");
    try {
      await api.redeemReward(r.id);
      setSuccess(`¡"${r.name}" canjeado correctamente!`);
      api.getCustomerPoints().then(setPts).catch(() => {});
      api.getMyRedeemedRewards().then(setHistory).catch(() => {});
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) { setError(err.message || "Error al canjear."); setTimeout(() => setError(""), 4000); }
    finally { setRedeemingId(null); }
  };

  const cur = pts?.points ?? 0;
  const tabBtn = (t: "available" | "history", label: string) => (
    <button onClick={() => setTab(t)} style={{ flex: 1, padding: "12px 8px", background: tab === t ? "rgba(212,255,0,0.07)" : "transparent", border: "none", borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent", color: tab === t ? "var(--text)" : "var(--muted)", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.2s ease" }}>{label}</button>
  );

  if (!isOpen) return null;
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", animation: "page-in 300ms var(--ease-out-expo)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1.5px solid var(--border)", background: "rgba(212,255,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Mis Recompensas</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Canjea premios con tus puntos acumulados</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface-2)", border: "1.5px solid var(--primary)", padding: "8px 14px", borderRadius: "24px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M15 9.5a3 3 0 0 0-6 0c0 3 6 3 6 6a3 3 0 0 1-6 0" /></svg>
              <span style={{ fontSize: "15px", fontWeight: 800 }}>{loadingPts ? "..." : cur}<span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginLeft: "3px" }}>pts</span></span>
            </div>
            <CloseBtn onClose={onClose} />
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1.5px solid var(--border)" }}>
          {tabBtn("available", "Canjear Premios")}
          {tabBtn("history", `Mis Canjes (${history.length})`)}
        </div>
        {/* Alerts */}
        {(error || success) && <div style={{ padding: "12px 24px 0" }}>{error && <Alert msg={error} type="error" />}{success && <Alert msg={success} type="success" />}</div>}
        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>
          {tab === "available" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Selecciona un comercio</label>
                <select value={bizId} onChange={e => setBizId(e.target.value)} style={{ ...inputStyle, fontWeight: 600 }}>
                  <option value="">— Elige un comercio —</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {!bizId ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>Selecciona un comercio para ver sus premios.</p>
                </div>
              ) : loadingRew ? <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>Cargando premios...</p> : rewards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>Este comercio no tiene premios disponibles.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {rewards.map(r => {
                    const canAfford = cur >= r.pointsCost;
                    const isRedeeming = redeemingId === r.id;
                    return (
                      <div key={r.id} style={{ padding: "16px", border: "1.5px solid var(--border)", borderRadius: "12px", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", opacity: canAfford ? 1 : 0.75 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700 }}>{r.name}</p>
                          <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>{r.description}</p>
                          {!canAfford && <p style={{ margin: 0, fontSize: "11px", color: "#FF9500", fontWeight: 600 }}>Te faltan {r.pointsCost - cur} puntos</p>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                          <span style={{ background: canAfford ? "rgba(212,255,0,0.12)" : "var(--surface)", color: canAfford ? "var(--primary)" : "var(--muted)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 800 }}>{r.pointsCost} pts</span>
                          <button onClick={() => handleRedeem(r)} disabled={!canAfford || isRedeeming} style={{ padding: "7px 14px", borderRadius: "7px", border: "none", background: canAfford ? "var(--primary)" : "var(--surface)", color: canAfford ? "black" : "var(--muted)", fontWeight: 700, fontSize: "12px", cursor: canAfford && !isRedeeming ? "pointer" : "not-allowed", opacity: isRedeeming ? 0.7 : 1, whiteSpace: "nowrap" }}>
                            {isRedeeming ? "Canjeando..." : canAfford ? "Canjear" : "Sin puntos"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                <p style={{ margin: 0, fontSize: "14px" }}>Aún no has canjeado ningún premio.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {history.map(rr => (
                  <div key={rr.id} style={{ padding: "14px 16px", border: "1.5px solid var(--border)", borderRadius: "10px", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700 }}>{rr.reward?.name ?? "Premio"}</p>
                      {rr.reward?.description && <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>{rr.reward.description}</p>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "var(--muted)" }}>{new Date(rr.redeemedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      {rr.reward?.pointsCost && <span style={{ background: "rgba(212,255,0,0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 800 }}>{rr.reward.pointsCost} pts</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [rewardsManagerOpen, setRewardsManagerOpen] = useState(false);
  const [givePointsOpen, setGivePointsOpen] = useState(false);
  const [clientRewardsOpen, setClientRewardsOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isBusiness = user?.role === "business";
  const isClient = user?.role === "client";
  const showRoleIcon = isClient || isBusiness;
  const title = isAdmin ? "Centro de Operaciones" : isBusiness ? "Area de negocio" : "Area de usuario";

  const btnStyle: React.CSSProperties = {
    display: "grid", placeItems: "center",
    width: "42px", height: "42px", padding: 0,
    borderRadius: "12px", border: "1.5px solid var(--border)",
    background: "var(--surface-2)", color: "var(--text)",
    cursor: "pointer", transition: "all 0.2s ease",
  };

  return (
    <>
      <header className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", boxSizing: "border-box" }}>
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {showRoleIcon && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/favicon.ico" alt="" width={40} height={40} aria-hidden="true" style={{ width: "auto", height: "36px", objectFit: "contain", flex: "0 0 auto" }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "stretch" }}>
            <h1 className="admin-header__title" style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", margin: 0, lineHeight: "1.1" }}>
              <span style={{ display: "block", width: "100%" }}>{title}</span>
            </h1>
            <p className="admin-header__subtitle" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: 0, marginTop: "2px", lineHeight: "1.1", whiteSpace: "nowrap" }}>
              {isAdmin ? "Panel de Control Administrativo" : isBusiness ? "Reservas y actividad reciente" : "Reservas y comercios disponibles"}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="admin-header__actions" style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "visible" }}>

          {/* Manager buttons */}
          {isBusiness && (
            <>
              <button onClick={() => setRewardsManagerOpen(true)} className="theme-toggle-btn" style={btnStyle} title="Crear Premios" aria-label="Crear Premios">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button onClick={() => setGivePointsOpen(true)} className="theme-toggle-btn" style={btnStyle} title="Dar Puntos" aria-label="Dar Puntos">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12" />
                  <path d="M15 9.5a3 3 0 0 0-6 0c0 3 6 3 6 6a3 3 0 0 1-6 0" />
                </svg>
              </button>
            </>
          )}

          {/* Client button */}
          {isClient && (
            <button onClick={() => setClientRewardsOpen(true)} className="theme-toggle-btn" style={btnStyle} title="Mis Recompensas" aria-label="Mis Recompensas">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </button>
          )}

          {(isAdmin || isBusiness) && <NotificationDropdown />}

          {/* Theme button */}
          <button onClick={toggleTheme} className="theme-toggle-btn" style={btnStyle} title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}>
            {theme === "light" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
          <UserMenu />
        </div>
      </header>

      {/* Modals */}
      <RewardsManagerModal isOpen={rewardsManagerOpen} onClose={() => setRewardsManagerOpen(false)} />
      <GivePointsModal isOpen={givePointsOpen} onClose={() => setGivePointsOpen(false)} />
      <ClientRewardsModal isOpen={clientRewardsOpen} onClose={() => setClientRewardsOpen(false)} />
    </>
  );
}
