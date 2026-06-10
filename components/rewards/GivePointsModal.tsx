"use client";

import { useEffect, useState } from "react";
import { getCustomers, addPointsToCustomer } from "@/lib/api";
import { Customer } from "@/lib/types";
import ModalPortal from "@/components/ui/ModalPortal";

interface GivePointsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function GivePointsModal({ onClose, onSuccess }: GivePointsModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers", err);
        setError("No se pudieron cargar los clientes.");
      }
    }
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !points) {
      setError("Por favor rellena todos los campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addPointsToCustomer(parseInt(selectedCustomerId), parseInt(points));
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir puntos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">Asignar Puntos</h3>
          <p className="modal-text">Otorga puntos de recompensa a uno de tus clientes.</p>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="input--full">
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Cliente
              </label>
              <select
                className="select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Selecciona un cliente...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="input--full">
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Cantidad de Puntos
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="input"
                placeholder="50"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
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
                disabled={loading || customers.length === 0}
              >
                {loading ? "Asignando..." : "Asignar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
