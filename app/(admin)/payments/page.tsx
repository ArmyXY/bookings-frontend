"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentModal from "@/components/payments/PaymentModal";
import { getPayments, updatePayment } from "@/lib/api";
import { Payment, PaymentMethod, PaymentStatus } from "@/lib/types";

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  completed: "Pagado",
  failed: "Fallido",
  refunded: "Devuelto",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

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
  const metaClass =
    variant === "positive"
      ? "kpi-card__meta--positive"
      : variant === "warning"
        ? "kpi-card__meta--warning"
        : "";

  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{title}</p>
      <h3 className="kpi-card__value">{value}</h3>
      <p className={`kpi-card__meta ${metaClass}`}>{subtitle}</p>
    </div>
  );
}

function Badge({ status }: { status: PaymentStatus }) {
  const variant =
    status === "completed"
      ? "confirmed"
      : status === "refunded"
        ? "paid"
        : "pending";

  return <span className={`badge badge--${variant}`}>{paymentStatusLabels[status]}</span>;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPayments = async () => {
    setErrorMessage("");

    try {
      const data = await getPayments();
      setPayments(data);
    } catch (err) {
      console.error("Failed to load payments", err);
      setErrorMessage("No se pudieron cargar los cobros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const totalCollected = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "completed")
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments]
  );

  const pendingCount = useMemo(
    () => payments.filter((payment) => payment.status === "pending").length,
    [payments]
  );

  const markPaymentAsPaid = async (paymentId: number) => {
    setUpdatingPaymentId(paymentId);
    setErrorMessage("");

    try {
      const updatedPayment = await updatePayment(paymentId, { status: "completed" });
      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, ...updatedPayment } : payment
        )
      );
    } catch (err) {
      console.error("Failed to update payment", err);
      setErrorMessage("No se pudo marcar el cobro como pagado.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Cobros</h2>
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
          value={formatCurrency(totalCollected)}
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
          title="Ultimo registro"
          value={payments.length > 0 ? formatCurrency(Number(payments[0].amount)) : "--"}
          subtitle="Volumen mas reciente"
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
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            {payments.length} resultados
          </span>
        </div>

        {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

        {loading ? (
          <p>Cargando cobros...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cita ID</th>
                <th>Importe</th>
                <th>Metodo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 600 }}>
                    COB-{String(payment.id).padStart(3, "0")}
                  </td>
                  <td>Cita #{payment.appointmentId}</td>
                  <td>{formatCurrency(Number(payment.amount))}</td>
                  <td>{paymentMethodLabels[payment.method]}</td>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>
                  <td>
                    <button
                      className="secondary-btn table-action-btn"
                      type="button"
                      onClick={() => markPaymentAsPaid(payment.id)}
                      disabled={payment.status !== "pending" || updatingPaymentId === payment.id}
                    >
                      {updatingPaymentId === payment.id ? "Actualizando..." : "Marcar pagado"}
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No hay cobros registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && (
        <PaymentModal onClose={() => setIsModalOpen(false)} onSuccess={loadPayments} />
      )}
    </div>
  );
}
