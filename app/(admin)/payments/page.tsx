"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentModal from "@/components/payments/PaymentModal";
import { deletePayment, getPayments, updatePayment } from "@/lib/api";
import { Payment, PaymentMethod, PaymentStatus } from "@/lib/types";

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
    title.includes("Cobrado") ? (
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

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => matchesStatusFilter(payment, statusFilter));
  }, [payments, statusFilter]);

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
    } catch (err) {
      console.error("Failed to update payment", err);
      setErrorMessage("No se pudo marcar el cobro como pagado.");
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
    } catch {
      setErrorMessage("No se pudo eliminar el cobro.");
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
        <KpiCard title="Estado" value="Sincronizado" subtitle="Conectado a la BD" />
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <div className="filter-row">
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("all")}>
              Todos
            </button>
            {paymentFilterStatuses.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className="filter-pill"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          {filteredPayments.length} de {payments.length} resultados
        </span>

        {loading ? (
          <p>Cargando cobros...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cita</th>
                <th>Cliente</th>
                <th>Negocio</th>
                <th>Importe</th>
                <th>Metodo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>
                      COB-{String(payment.id).padStart(3, "0")}
                    </td>
                    <td>#{payment.appointmentId}</td>
                    <td>{getCustomerName(payment)}</td>
                    <td>{getBusinessName(payment)}</td>
                    <td>{formatCurrency(Number(payment.amount))}</td>
                    <td>{paymentMethodLabels[payment.method]}</td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      <Badge status={payment.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-btn table-action-btn"
                          type="button"
                          onClick={() => markPaymentAsPaid(payment.id)}
                          disabled={
                            payment.status !== "pendiente" || updatingPaymentId === payment.id
                          }
                        >
                          {updatingPaymentId === payment.id ? "Actualizando..." : "Marcar pagado"}
                        </button>
                        <button
                          className="secondary-btn table-action-btn"
                          type="button"
                          onClick={() => removePayment(payment.id)}
                          disabled={deletingPaymentId === payment.id}
                        >
                          {deletingPaymentId === payment.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="empty-table-cell">
                    No hay cobros registrados.
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
