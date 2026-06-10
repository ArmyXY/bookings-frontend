"use client";

import { useState } from "react";
import { createReward } from "@/lib/api";
import ModalPortal from "@/components/ui/ModalPortal";

interface CreateRewardModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRewardModal({ onClose, onSuccess }: CreateRewardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !pointsCost) {
      setError("Por favor rellena todos los campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createReward({
        name,
        description,
        pointsCost: parseInt(pointsCost),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear recompensa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">Crear Recompensa</h3>
          <p className="modal-text">Crea una nueva recompensa para tus clientes.</p>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="input--full">
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Nombre de la recompensa
              </label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Corte de pelo gratis"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input--full">
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Descripción
              </label>
              <textarea
                className="input"
                placeholder="Detalles sobre esta recompensa"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ resize: "vertical", minHeight: 80 }}
              />
            </div>

            <div className="input--full">
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Coste en Puntos
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="input"
                placeholder="100"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
                required
              />
            </div>

            {error ? <p className="input--full message-error">{error}</p> : null}

            <div className="input--full modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
