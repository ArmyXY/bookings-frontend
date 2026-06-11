"use client";

import React, { useState, useEffect } from "react";
import {
  getCustomerPoints,
  getBusinesses,
  getRewardsByBusiness,
  redeemReward,
  getMyRedeemedRewards,
} from "@/lib/api";
import type { Reward, CustomerPoints, Business, RedeemedReward } from "@/lib/types";

interface ClientRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientRewardsModal({ isOpen, onClose }: ClientRewardsModalProps) {
  const [points, setPoints] = useState<CustomerPoints | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);

  const [loadingPoints, setLoadingPoints] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "history">("available");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
      setSelectedBusinessId("");
      setRewards([]);
      setActiveTab("available");
      fetchAll();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchRewardsForBusiness(Number(selectedBusinessId));
    } else {
      setRewards([]);
    }
  }, [selectedBusinessId]);

  const fetchAll = async () => {
    await Promise.all([fetchPoints(), fetchBusinesses(), fetchHistory()]);
  };

  const fetchPoints = async () => {
    try {
      setLoadingPoints(true);
      const data = await getCustomerPoints();
      setPoints(data);
    } catch {
      setPoints(null);
    } finally {
      setLoadingPoints(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const data = await getBusinesses();
      setBusinesses(data);
    } catch {
      console.error("Error fetching businesses");
    }
  };

  const fetchRewardsForBusiness = async (businessId: number) => {
    try {
      setLoadingRewards(true);
      const data = await getRewardsByBusiness(businessId);
      setRewards(data);
    } catch {
      setRewards([]);
    } finally {
      setLoadingRewards(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await getMyRedeemedRewards();
      setRedeemedRewards(data);
    } catch {
      console.error("Error fetching history");
    }
  };

  const handleRedeem = async (reward: Reward) => {
    const currentPoints = points?.points ?? 0;
    if (currentPoints < reward.costPoints) {
      setError(`Necesitas ${reward.costPoints - currentPoints} puntos más para canjear "${reward.name}".`);
      setTimeout(() => setError(""), 4000);
      return;
    }

    setRedeemingId(reward.id);
    setError("");
    try {
      await redeemReward(reward.id);
      setSuccess(`¡"${reward.name}" canjeado correctamente!`);
      fetchPoints();
      fetchHistory();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Error al canjear el premio.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setRedeemingId(null);
    }
  };

  if (!isOpen) return null;

  const currentPoints = points?.points ?? 0;

  const tabBtn = (tab: "available" | "history", label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        flex: 1, padding: "12px 8px",
        background: activeTab === tab ? "rgba(212,255,0,0.07)" : "transparent",
        border: "none",
        borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
        color: activeTab === tab ? "var(--text)" : "var(--muted)",
        fontWeight: 700, fontSize: "13px",
        cursor: "pointer", transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );

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
        width: "100%", maxWidth: "560px",
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "page-in 300ms var(--ease-out-expo)",
      }}>

        {/* Header con puntos */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1.5px solid var(--border)",
          background: "rgba(212,255,0,0.03)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>Mis Recompensas</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>Canjea premios con tus puntos acumulados</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Puntos totales */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "var(--surface-2)",
              border: "1.5px solid var(--primary)",
              padding: "8px 14px", borderRadius: "24px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v12" />
                <path d="M15 9.5a3 3 0 0 0-6 0c0 3 6 3 6 6a3 3 0 0 1-6 0" />
              </svg>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
                {loadingPoints ? "..." : currentPoints}
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginLeft: "3px" }}>pts</span>
              </span>
            </div>

            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", display: "grid", placeItems: "center", borderRadius: "8px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1.5px solid var(--border)" }}>
          {tabBtn("available", "Canjear Premios")}
          {tabBtn("history", `Mis Canjes (${redeemedRewards.length})`)}
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div style={{ padding: "12px 24px", paddingBottom: 0 }}>
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
          </div>
        )}

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>

          {activeTab === "available" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Selecciona un comercio</label>
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: "14px",
                    outline: "none",
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  <option value="">— Elige un comercio —</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {!selectedBusinessId ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "12px", opacity: 0.5 }}>
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <p style={{ margin: 0, fontSize: "14px" }}>Selecciona un comercio para ver sus premios disponibles.</p>
                </div>
              ) : loadingRewards ? (
                <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", padding: "20px" }}>Cargando premios...</p>
              ) : rewards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>Este comercio todavía no tiene premios disponibles.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {rewards.map(reward => {
                    const canAfford = currentPoints >= reward.costPoints;
                    const isRedeeming = redeemingId === reward.id;
                    const missing = reward.costPoints - currentPoints;

                    return (
                      <div key={reward.id} style={{
                        padding: "16px",
                        border: `1.5px solid ${canAfford ? "var(--border)" : "var(--border)"}`,
                        borderRadius: "12px",
                        background: "var(--surface-2)",
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
                        opacity: canAfford ? 1 : 0.75,
                        transition: "opacity 0.2s",
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700 }}>{reward.name}</p>
                          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>{reward.description}</p>
                          {!canAfford && (
                            <p style={{ margin: 0, fontSize: "11px", color: "#FF9500", fontWeight: 600 }}>
                              Te faltan {missing} puntos
                            </p>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                          <span style={{
                            background: canAfford ? "rgba(212,255,0,0.12)" : "var(--surface)",
                            color: canAfford ? "var(--primary)" : "var(--muted)",
                            padding: "4px 10px", borderRadius: "20px",
                            fontSize: "12px", fontWeight: 800,
                          }}>
                            {reward.costPoints} pts
                          </span>
                          <button
                            onClick={() => handleRedeem(reward)}
                            disabled={!canAfford || isRedeeming}
                            style={{
                              padding: "7px 14px", borderRadius: "7px", border: "none",
                              background: canAfford ? "var(--primary)" : "var(--surface)",
                              color: canAfford ? "black" : "var(--muted)",
                              fontWeight: 700, fontSize: "12px",
                              cursor: canAfford && !isRedeeming ? "pointer" : "not-allowed",
                              opacity: isRedeeming ? 0.7 : 1,
                              transition: "all 0.2s",
                              whiteSpace: "nowrap",
                            }}
                          >
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
            /* History tab */
            <>
              {redeemedRewards.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "12px", opacity: 0.5 }}>
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <p style={{ margin: 0, fontSize: "14px" }}>Aún no has canjeado ningún premio.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {redeemedRewards.map(rr => (
                    <div key={rr.id} style={{
                      padding: "14px 16px",
                      border: "1.5px solid var(--border)",
                      borderRadius: "10px",
                      background: "var(--surface-2)",
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    }}>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700 }}>
                          {rr.reward?.name ?? "Premio"}
                        </p>
                        {rr.reward?.description && (
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>
                            {rr.reward.description}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                        <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--muted)" }}>
                          {new Date(rr.redeemedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                        {rr.reward?.costPoints && (
                          <span style={{
                            background: "rgba(212,255,0,0.1)", color: "var(--primary)",
                            padding: "2px 8px", borderRadius: "20px",
                            fontSize: "11px", fontWeight: 800,
                          }}>
                            {rr.reward.costPoints} pts
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

