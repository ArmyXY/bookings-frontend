"use client";

import { useEffect, useState } from "react";
import {
  getCustomerPoints,
  getRewardsByBusiness,
  redeemReward,
  CustomerPoints,
  Reward,
} from "@/lib/api";
import ModalPortal from "@/components/ui/ModalPortal";

interface CustomerRewardsModalProps {
  onClose: () => void;
}

export default function CustomerRewardsModal({ onClose }: CustomerRewardsModalProps) {
  const [pointsData, setPointsData] = useState<CustomerPoints[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load customer points
        const points = await getCustomerPoints();
        setPointsData(points);

        // Load rewards for the businesses the customer has points in
        const businessIds = Array.from(new Set(points.map((p) => p.businessId)));
        
        let allRewards: Reward[] = [];
        for (const bId of businessIds) {
          const bRewards = await getRewardsByBusiness(bId);
          allRewards = [...allRewards, ...bRewards];
        }
        setRewards(allRewards);
      } catch (err) {
        console.error("Failed to load rewards data", err);
        setError("No se pudieron cargar tus recompensas.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalPoints = pointsData.reduce((sum, cp) => sum + cp.points, 0);

  const handleRedeem = async (reward: Reward) => {
    try {
      const confirmed = window.confirm(`¿Estás seguro de que quieres canjear "${reward.name}" por ${reward.pointsCost} puntos?`);
      if (!confirmed) return;

      setLoading(true);
      await redeemReward(reward.id);
      
      // Reload points after redeeming
      const newPoints = await getCustomerPoints();
      setPointsData(newPoints);
      
      alert("¡Recompensa canjeada con éxito!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al canjear recompensa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 className="modal-title" style={{ margin: 0 }}>Mis Recompensas</h3>
            <div style={{ 
              background: "var(--primary)", 
              color: "white", 
              padding: "6px 12px", 
              borderRadius: "20px",
              fontWeight: "bold",
              fontSize: "14px"
            }}>
              {totalPoints} Puntos Totales
            </div>
          </div>
          
          {error ? <p className="message-error" style={{ marginBottom: 16 }}>{error}</p> : null}

          {loading && pointsData.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px 0" }}>Cargando...</p>
          ) : (
            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
              {rewards.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0" }}>
                  No hay recompensas disponibles en este momento.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {rewards.map((reward) => {
                    const businessPoints = pointsData.find((p) => p.businessId === reward.businessId)?.points || 0;
                    const canRedeem = businessPoints >= reward.pointsCost;

                    return (
                      <div 
                        key={reward.id} 
                        style={{ 
                          border: "1px solid var(--border)", 
                          borderRadius: "8px", 
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{reward.name}</h4>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                              {pointsData.find((p) => p.businessId === reward.businessId)?.business.name || `Negocio #${reward.businessId}`}
                            </p>
                          </div>
                          <span style={{ fontWeight: "bold", color: canRedeem ? "var(--primary)" : "var(--muted)" }}>
                            {reward.pointsCost} pts
                          </span>
                        </div>
                        
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
                          {reward.description}
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            Tienes {businessPoints} puntos en este negocio
                          </span>
                          <button 
                            className="primary-btn" 
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                            disabled={!canRedeem || loading}
                            onClick={() => handleRedeem(reward)}
                          >
                            Canjear
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="input--full modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
