"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentModal from "@/components/payments/PaymentModal";
import { deletePayment, getPayments, updatePayment } from "@/lib/api";
import { Payment, PaymentMethod, PaymentStatus } from "@/lib/types";
import { useNotifications } from "@/components/providers/NotificationProvider";
import StatsCard from "@/components/ui/StatsCard";
import ModalPortal from "@/components/ui/ModalPortal";

import { useTableSort } from "@/hooks/useTableSort";

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
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
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

  const displayPayments = useMemo(() => {
    return filteredPayments.map((payment) => ({
      ...payment,
      reference: `#PY-${String(payment.id).padStart(3, '0')}`,
      operationName: `Reserva #${payment.appointmentId} (${getCustomerName(payment)})`,
      methodLabel: paymentMethodLabels[payment.method],
      statusLabel: paymentStatusLabels[payment.status],
    }));
  }, [filteredPayments]);

  const { requestSort, sortedData: sortedPayments, renderSortIcon } = useTableSort(displayPayments, 'id', 'desc');

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

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingPaymentId(deleteTargetId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deletePayment(deleteTargetId);
      setPayments((currentPayments) =>
        currentPayments.filter((payment) => payment.id !== deleteTargetId)
      );
      setSuccessMessage("Cobro eliminado correctamente.");
      addNotification({
        title: "Cobro Eliminado",
        description: `Se ha borrado el registro de cobro #${deleteTargetId}.`,
        type: "info"
      });
      setDeleteTargetId(null);
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
  }

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
        <StatsCard
          title="Cobrado total"
          value={formatCurrency(totalCollected)}
          subtitle={`${payments.filter(p => p.status === 'pagado').length} operaciones exitosas`}
          loading={loading}
          trend={{ value: "Ingresos", positive: true }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatsCard
          title="Pendientes"
          value={String(pendingCount)}
          subtitle="Cobros por revisar"
          loading={loading}
          trend={{ value: "Acción", positive: false }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatsCard
          title="Ultimo registro"
          value={payments.length > 0 ? formatCurrency(Number(payments[0].amount)) : "--"}
          subtitle="Volumen más reciente"
          loading={loading}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <StatsCard 
          title="Total por cobrar" 
          value={formatCurrency(totalPending)} 
          subtitle="Deuda pendiente acumulada" 
          loading={loading}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
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
                <th className="sortable-header" onClick={() => requestSort('reference')}>Referencia {renderSortIcon('reference')}</th>
                <th className="sortable-header" onClick={() => requestSort('operationName')}>Operación {renderSortIcon('operationName')}</th>
                <th className="sortable-header" onClick={() => requestSort('amount')}>Importe {renderSortIcon('amount')}</th>
                <th className="sortable-header" onClick={() => requestSort('methodLabel')}>Método {renderSortIcon('methodLabel')}</th>
                <th className="sortable-header" onClick={() => requestSort('createdAt')}>Fecha {renderSortIcon('createdAt')}</th>
                <th className="sortable-header" onClick={() => requestSort('statusLabel')}>Estado {renderSortIcon('statusLabel')}</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 700, color: "var(--muted)" }}>{payment.reference}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>Reserva #{payment.appointmentId} <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>({getCustomerName(payment as any)})</span></td>
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
                        onClick={() => setDeleteTargetId(payment.id)}
                      >
                        Eliminar
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

      {deleteTargetId !== null && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTargetId(null);
            }}
          >
            <div className="modal-card">
              <div className="modal-icon">!</div>
              <h3 className="modal-title">Eliminar cobro</h3>
              <p className="modal-text">
                ¿Seguro que quieres eliminar el registro de cobro <strong>#PY-{String(deleteTargetId).padStart(3, '0')}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                >
                  Cancelar
                </button>
                <button
                  className="danger-btn"
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingPaymentId !== null}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {deletingPaymentId !== null ? (
                    <>
                      <div className="spinner spinner--sm"></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
