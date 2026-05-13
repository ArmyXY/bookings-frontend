"use client";

import { useState, useEffect } from "react";
import { getPayments } from "../../../lib/api";
import { Payment, PaymentStatus } from "../../../lib/types";
import PaymentModal from "../../../components/payments/PaymentModal";

function KpiCard({
  title,
  value,
  subtitle,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  variant?: "positive" | "warning";
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p
        className={`kpi-card__meta ${
          variant === "positive"
            ? "kpi-card__meta--positive"
            : variant === "warning"
              ? "kpi-card__meta--warning"
              : ""
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Badge({ status }: { status: PaymentStatus }) {
  const label = status === "completed" ? "Pagado" : status === "pending" ? "Pendiente" : status;
  const variant = status === "completed" ? "confirmed" : "pending";
  
  return (
    <span className={`badge badge--${variant}`}>
      {label}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPayments = async () => {
    try {
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const totalCollected = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingCount = payments.filter(p => p.status === "pending").length;

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Payments</h2>
          <p>Seguimiento de cobros realizados y pendientes.</p>
        </div>

        <button 
          className="primary-btn" 
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          Registrar cobro
        </button>
      </section>

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado total"
          value={`${totalCollected.toFixed(2)} €`}
          subtitle={`${payments.length} operaciones registradas`}
          variant="positive"
        />
        <KpiCard
          title="Pendientes"
          value={String(pendingCount)}
          subtitle="Cobros por revisar"
          variant="warning"
        />
        <KpiCard 
          title="Último registro" 
          value={payments.length > 0 ? `${Number(payments[0].amount).toFixed(2)} €` : "--"} 
          subtitle="Volumen más reciente" 
        />
        <KpiCard 
          title="Estado" 
          value="Sincronizado" 
          subtitle="Conectado a la BD" 
        />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {payments.length} resultados
          </span>
        </div>

        {loading ? (
          <p>Cargando cobros...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cita ID</th>
                <th>Importe</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 600 }}>COB-{String(payment.id).padStart(3, '0')}</td>
                  <td>Cita #{payment.appointmentId}</td>
                  <td>{Number(payment.amount).toFixed(2)} €</td>
                  <td style={{ textTransform: "capitalize" }}>{payment.method}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", paddingTop: 20, paddingBottom: 20, color: "#6b7280" }}>
                    No hay cobros registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && (
        <PaymentModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadPayments}
        />
      )}
    </div>
  );
}