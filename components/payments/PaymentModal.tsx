"use client";

import { useState, useEffect } from "react";
import { getAppointments, createPayment } from "../../lib/api";
import { Appointment, PaymentMethod } from "../../lib/types";

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await getAppointments();
        // Filter only those that are not already paid (if status is 'paid')
        // Or simply all confirmed ones.
        setAppointments(data.filter(a => a.status !== "paid"));
      } catch (err) {
        console.error("Failed to load appointments", err);
      }
    }
    loadAppointments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId || !amount) {
      setError("Por favor rellena todos los campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createPayment({
        appointmentId: parseInt(selectedAppointmentId),
        amount: parseFloat(amount),
        method: method,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Registrar Cobro</h3>
        <p className="modal-text">Selecciona una cita y registra el pago correspondiente.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input--full">
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Cita pendiente
            </label>
            <select
              className="select"
              value={selectedAppointmentId}
              onChange={(e) => setSelectedAppointmentId(e.target.value)}
              required
            >
              <option value="">Selecciona una cita...</option>
              {appointments.map((app) => (
                <option key={app.id} value={app.id}>
                  ID: {app.id} - {app.serviceName} ({app.date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Importe (€)
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Método de pago
            </label>
            <select
              className="select"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value={PaymentMethod.CASH}>Efectivo</option>
              <option value={PaymentMethod.CARD}>Tarjeta</option>
              <option value={PaymentMethod.TRANSFER}>Transferencia</option>
            </select>
          </div>

          {error && <p className="input--full message-error">{error}</p>}

          <div className="input--full modal-actions" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading || appointments.length === 0}
            >
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
