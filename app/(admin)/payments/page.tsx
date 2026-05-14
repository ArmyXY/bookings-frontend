"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentModal from "@/components/payments/PaymentModal";
import { deletePayment, getPayments, updatePayment } from "@/lib/api";
import { Payment, PaymentMethod, PaymentStatus } from "@/lib/types";
import { useNotifications } from "@/components/providers/NotificationProvider";

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  devolucion: "Devuelto",
  "devolución": "Devuelto",
  "devoluciÃ³n": "Devuelto",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

const paymentFilterStatuses: { label: string; value: PaymentStatus }[] = [
  { label: "Pendientes", value: "pendiente" },
  { label: "Pagados", value: "pagado" },
  { label: "Devueltos", value: "devolucion" },
];

function isRefundedStatus(status: PaymentStatus) {
  return status !== "pendiente" && status !== "pagado";
}

function matchesStatusFilter(payment: Payment, filter: "all" | PaymentStatus) {
  if (filter === "all") return true;
  if (filter === "devolucion") return isRefundedStatus(payment.status);

  return payment.status === filter;
}

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
  const icon = 
    title.includes("Cobrado") || title.includes("por cobrar") ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ) :
    title.includes("Pendientes") ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ) :
    title.includes("Ultimo") ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    );

  const metaClass =
    variant === "positive"
      ? "kpi-card__meta--positive"
      : variant === "warning"
        ? "kpi-card__meta--warning"
        : "";

  return (
    <div className="kpi-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="kpi-card__label">{title}</p>
        <span style={{ color: "var(--primary)", opacity: 0.8 }}>{icon}</span>
      </div>
      <h3 className="kpi-card__value">{value}</h3>
      <p className={`kpi-card__meta ${metaClass}`}>{subtitle}</p>
    </div>
  );
}

function Badge({ status }: { status: PaymentStatus }) {
  const variant = status === "pagado" ? "confirmed" : status === "pendiente" ? "pending" : "paid";

  return <span className={`badge badge--${variant}`}>{paymentStatusLabels[status]}</span>;
}

function getCustomerName(payment: Payment) {
  return payment.customer?.name ?? payment.appointment?.customer?.name ?? `Cliente #${payment.customerId ?? "-"}`;
}

function getBusinessName(payment: Payment) {
  return payment.business?.name ?? payment.appointment?.business?.name ?? `Negocio #${payment.businessId ?? "-"}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
        .filter((payment) => payment.status === "pagado")
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments]
  );

  const pendingCount = useMemo(
    () => payments.filter((payment) => payment.status === "pendiente").length,
    [payments]
  );

  const totalPending = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "pendiente")
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => matchesStatusFilter(payment, statusFilter));
  }, [payments, statusFilter]);

  const { addNotification } = useNotifications();

  const markPaymentAsPaid = async (paymentId: number) => {
    setUpdatingPaymentId(paymentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedPayment = await updatePayment(paymentId, { status: "pagado" });
      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, ...updatedPayment } : payment
        )
      );
      setSuccessMessage("Cobro marcado como pagado.");
      addNotification({
        title: "Cobro Realizado",
        description: `El cobro #${paymentId} ha sido marcado como pagado.`,
        type: "success"
      });
    } catch (err) {
      console.error("Failed to update payment", err);
      setErrorMessage("No se pudo marcar el cobro como pagado.");
      addNotification({
        title: "Error en Cobro",
        description: `No se pudo actualizar el estado del cobro #${paymentId}.`,
        type: "error"
      });
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const removePayment = async (paymentId: number) => {
    setDeletingPaymentId(paymentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deletePayment(paymentId);
      setPayments((currentPayments) =>
        currentPayments.filter((payment) => payment.id !== paymentId)
      );
      setSuccessMessage("Cobro eliminado correctamente.");
      addNotification({
        title: "Cobro Eliminado",
        description: `Se ha borrado el registro de cobro #${paymentId}.`,
        type: "info"
      });
    } catch {
      setErrorMessage("No se pudo eliminar el cobro.");
      addNotification({
        title: "Error al Borrar",
        description: "No se pudo eliminar el cobro solicitado.",
        type: "error"
      });
    } finally {
      setDeletingPaymentId(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Cobros</h2>
          <p>Seguimiento de cobros, clientes, negocios y citas relacionadas.</p>
        </div>

        <div style={{ position: "relative", zIndex: 3 }}>
          <button className="primary-btn" type="button" onClick={() => setIsModalOpen(true)}>
            Registrar cobro
          </button>
        </div>

        <div style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          opacity: 0.15,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(5deg)"
        }}>
          <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          title="Cobrado total"
          value={formatCurrency(totalCollected)}
          subtitle={`${payments.filter(p => p.status === 'pagado').length} operaciones`}
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
          title="Total por cobrar" 
          value={formatCurrency(totalPending)} 
          subtitle="Deuda pendiente" 
          variant="warning"
        />
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

      <section className="section-card page-transition" style={{ animationDelay: "100ms" }}>
        <div className="panel-title-row">
          <h3 className="panel-title">Historial de Transacciones</h3>
          <div className="filter-row">
            <button type="button" className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("all")}>Todos</button>
            {paymentFilterStatuses.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`filter-pill ${statusFilter === value ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
            <p>Sincronizando datos...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Operación</th>
                <th>Importe</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 700, color: "var(--muted)" }}>#PY-{String(payment.id).padStart(3, '0')}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>Reserva #{payment.appointmentId} <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>({getCustomerName(payment)})</span></td>
                  <td style={{ fontWeight: 800, fontSize: "16px" }}>{Number(payment.amount).toFixed(2)} €</td>
                  <td style={{ textTransform: "uppercase", fontSize: "12px", fontWeight: 700 }}>{paymentMethodLabels[payment.method]}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <Badge status={payment.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        className="secondary-btn"
                        type="button"
                        style={{ padding: "8px 16px" }}
                        onClick={() => markPaymentAsPaid(payment.id)}
                        disabled={payment.status !== "pendiente" || updatingPaymentId === payment.id}
                      >
                        {updatingPaymentId === payment.id ? "..." : "Pagado"}
                      </button>
                      <button
                        className="secondary-btn"
                        type="button"
                        style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.1)", color: "#FF3B30" }}
                        onClick={() => removePayment(payment.id)}
                        disabled={deletingPaymentId === payment.id}
                      >
                        {deletingPaymentId === payment.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "64px", color: "var(--muted)" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>∅</div>
                    No se encontraron cobros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen ? (
        <PaymentModal onClose={() => setIsModalOpen(false)} onSuccess={loadPayments} />
      ) : null}
    </div>
  );
}
