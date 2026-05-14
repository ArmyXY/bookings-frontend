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
        <div>
          <h2>Cobros</h2>
          <p>Seguimiento de cobros, clientes, negocios y citas relacionadas.</p>
        </div>

        <button className="primary-btn" type="button" onClick={() => setIsModalOpen(true)}>
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
        <KpiCard title="Estado" value="Sincronizado" subtitle="Conectado a la BD" />
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de cobros</h3>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
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
              {payments.length > 0 ? (
                payments.map((payment) => (
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
