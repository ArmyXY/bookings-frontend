"use client";

import { useEffect, useState } from "react";
import { createPayment, getAppointments } from "@/lib/api";
import { Appointment, PaymentMethod } from "@/lib/types";

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error al registrar el pago";
}

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await getAppointments();
        setAppointments(data.filter((appointment) => appointment.status !== "paid"));
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
        method,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
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
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  ID: {appointment.id} - {appointment.serviceName} ({appointment.date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Importe (EUR)
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
              Metodo de pago
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

          {error ? <p className="input--full message-error">{error}</p> : null}

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
