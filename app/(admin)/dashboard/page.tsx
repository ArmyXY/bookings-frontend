"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AppointmentStatus,
  Customer,
  DashboardStats,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";
import type { Booking } from "@/lib/api";
import { getAppointments, getCustomers, getDashboardStats } from "@/lib/api";

type DashboardView = "resumen" | "reservas" | "clientes" | "pagos";

function Badge({ status }: { status: AppointmentStatus | PaymentStatus }) {
  const labels: Record<AppointmentStatus | PaymentStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    paid: "Pagada",
    completed: "Completado",
    failed: "Fallido",
    refunded: "Devuelto",
  };

  const badgeStatus =
    status === "completed"
      ? "confirmed"
      : status === "refunded"
        ? "paid"
        : status === "failed"
          ? "pending"
          : status;

  return <span className={`badge badge--${badgeStatus}`}>{labels[status]}</span>;
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

function paymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
  };

  return labels[method];
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeView, setActiveView] = useState<DashboardView>("resumen");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
    setErrorMessage("");

    try {
      const [data, appointmentsData, customersData] = await Promise.all([
        getDashboardStats(),
        getAppointments(),
        getCustomers(),
      ]);
      setDashboard(data);
      setBookings(appointmentsData);
      setCustomers(customersData);
    } catch {
      setErrorMessage("No se pudieron cargar los datos del panel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const nextAppointment = dashboard?.recentActivity.appointments[0];
  const latestPayment = dashboard?.recentActivity.payments[0];

  const statusTotal = useMemo(() => {
    if (!dashboard) return 0;

    return (
      dashboard.appointmentsByStatus.pending +
      dashboard.appointmentsByStatus.confirmed +
      dashboard.appointmentsByStatus.paid
    );
  }, [dashboard]);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Panel de control</h2>
          <p>Control diario de reservas, clientes y cobros.</p>
        </div>
      </section>

      {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

      <section className="kpi-grid">
        <KpiCard
          title="Ingresos totales"
          value={dashboard ? formatCurrency(dashboard.stats.totalRevenue) : "-"}
          subtitle="Pagos completados"
          variant="positive"
        />
        <KpiCard
          title="Reservas totales"
          value={dashboard ? String(dashboard.stats.totalAppointments) : "-"}
          subtitle="Reservas registradas"
        />
        <KpiCard
          title="Reservas pendientes"
          value={dashboard ? String(dashboard.appointmentsByStatus.pending) : "-"}
          subtitle="Seguimiento necesario"
          variant="warning"
        />
        <KpiCard
          title="Clientes"
          value={dashboard ? String(dashboard.stats.totalCustomers) : "-"}
          subtitle="Clientes registrados correctamente"
        />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">
            {activeView === "reservas"
              ? "Reservas registradas"
              : activeView === "clientes"
                ? "Clientes registrados"
                : activeView === "pagos"
                  ? "Pagos recientes"
                  : "Datos del panel"}
          </h3>
          <div className="filter-row">
            <button
              className="filter-pill"
              type="button"
              onClick={() => setActiveView("resumen")}
            >
              Resumen
            </button>
            <button
              className="filter-pill"
              type="button"
              onClick={() => setActiveView("reservas")}
            >
              Reservas
            </button>
            <button
              className="filter-pill"
              type="button"
              onClick={() => setActiveView("clientes")}
            >
              Clientes
            </button>
            <button
              className="filter-pill"
              type="button"
              onClick={() => setActiveView("pagos")}
            >
              Pagos
            </button>
          </div>
        </div>

        {loading ? <div className="customer-card">Cargando datos...</div> : null}

        {!loading && dashboard && activeView === "resumen" ? (
          <section className="dashboard-grid">
            <div className="info-stack">
              <div className="info-box">
                <p className="info-box__eyebrow">Estado de reservas</p>
                <p className="info-box__title">{statusTotal} reservas clasificadas</p>
                <p className="info-box__text">
                  {dashboard.appointmentsByStatus.pending} pendientes,{" "}
                  {dashboard.appointmentsByStatus.confirmed} confirmadas y{" "}
                  {dashboard.appointmentsByStatus.paid} pagadas
                </p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">Siguiente actividad</p>
                <p className="info-box__title">
                  {nextAppointment?.customer ?? "Sin reservas recientes"}
                </p>
                <p className="info-box__text">
                  {nextAppointment
                    ? `${nextAppointment.service} · ${formatDate(nextAppointment.date)}`
                    : "No hay datos disponibles"}
                </p>
              </div>
            </div>

            <div className="info-stack">
              <div className="info-box">
                <p className="info-box__eyebrow">Ultimo pago</p>
                <p className="info-box__title">
                  {latestPayment ? formatCurrency(Number(latestPayment.amount)) : "Sin pagos"}
                </p>
                <p className="info-box__text">
                  {latestPayment
                    ? `${paymentMethodLabel(latestPayment.method)} · ${formatDate(latestPayment.date)}`
                    : "No hay pagos recientes"}
                </p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">Clientes registrados</p>
                <p className="info-box__title">{dashboard.stats.totalCustomers}</p>
                <p className="info-box__text">Registrados en tu APP 👍</p>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && activeView === "reservas" ? (
          <div className="page-stack" style={{ gap: 16 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "#6b7280", fontSize: 14 }}>
                {bookings.length} reservas encontradas
              </span>
              <Link className="secondary-btn" href="/bookings">
                Ver pagina de reservas
              </Link>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Servicio</th>
                  <th>Cliente</th>
                  <th>Comercio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ fontWeight: 600 }}>{booking.id}</td>
                      <td>{formatDate(booking.date)}</td>
                      <td>{booking.time}</td>
                      <td>{booking.serviceName}</td>
                      <td>{booking.customerId}</td>
                      <td>{booking.businessId}</td>
                      <td>
                        <Badge status={booking.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>No hay reservas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && activeView === "clientes" ? (
          <div className="page-stack" style={{ gap: 16 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "#6b7280", fontSize: 14 }}>
                {customers.length} clientes encontrados
              </span>
              <Link className="secondary-btn" href="/customers">
                Ver pagina de clientes
              </Link>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Reservas</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: 600 }}>{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || "Sin telefono"}</td>
                      <td>{customer.appointments?.length ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>No hay clientes registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && dashboard && activeView === "pagos" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Importe</th>
                <th>Metodo</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentActivity.payments.length > 0 ? (
                dashboard.recentActivity.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>{payment.id}</td>
                    <td>{formatCurrency(Number(payment.amount))}</td>
                    <td>{paymentMethodLabel(payment.method)}</td>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      <Badge status={payment.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No hay pagos recientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
