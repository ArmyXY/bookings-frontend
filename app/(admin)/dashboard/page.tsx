"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AppointmentStatus,
  Business,
  Customer,
  DashboardStats,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";
import type { Booking } from "@/lib/api";
import {
  getAppointments,
  getBusinesses,
  getCustomers,
  getDashboardStats,
} from "@/lib/api";

type DashboardView = "resumen" | "reservas" | "clientes" | "negocios" | "pagos";

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  completado: "Completada",
  cancelado: "Cancelada",
};

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

function Badge({ status }: { status: AppointmentStatus | PaymentStatus }) {
  const labels = { ...appointmentStatusLabels, ...paymentStatusLabels };
  const badgeStatus =
    status === "confirmado" || status === "completado" || status === "pagado"
      ? "confirmed"
      : status === "cancelado" || status === "devolucion" || status === "devolución" || status === "devoluciÃ³n"
        ? "paid"
        : "pending";

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

function getCustomerName(booking: Booking) {
  return booking.customer?.name ?? `Cliente #${booking.customerId}`;
}

function getBusinessName(booking: Booking) {
  return booking.business?.name ?? `Negocio #${booking.businessId}`;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeView, setActiveView] = useState<DashboardView>("resumen");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
    setErrorMessage("");

    try {
      const [data, appointmentsData, customersData, businessesData] = await Promise.all([
        getDashboardStats(),
        getAppointments(),
        getCustomers(),
        getBusinesses(),
      ]);
      setDashboard(data);
      setBookings(appointmentsData);
      setCustomers(customersData);
      setBusinesses(businessesData);
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

  const activeTitle =
    activeView === "reservas"
      ? "Reservas registradas"
      : activeView === "clientes"
        ? "Clientes registrados"
        : activeView === "negocios"
          ? "Negocios registrados"
          : activeView === "pagos"
            ? "Pagos recientes"
            : "Datos del panel";

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Panel de control</h2>
          <p>Control diario de reservas, clientes, negocios y cobros.</p>
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
          title="Negocios"
          value={String(businesses.length)}
          subtitle="Comercios conectados"
        />
        <KpiCard
          title="Clientes"
          value={dashboard ? String(dashboard.stats.totalCustomers) : "-"}
          subtitle="Clientes registrados"
        />
      </section>

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">{activeTitle}</h3>
          <div className="filter-row">
            {(["resumen", "reservas", "clientes", "negocios", "pagos"] as DashboardView[]).map(
              (view) => (
                <button
                  key={view}
                  className="filter-pill"
                  type="button"
                  onClick={() => setActiveView(view)}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
            <div className="spinner"></div>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</span>
          </div>
        ) : null}

        {!loading && dashboard && activeView === "resumen" ? (
          <section className="dashboard-grid">
            <div className="info-stack">
              <div className="info-box">
                <p className="info-box__eyebrow">Estado de reservas</p>
                <p className="info-box__title">{statusTotal} reservas clasificadas</p>
                <p className="info-box__text">
                  {dashboard.appointmentsByStatus.pending} pendientes,{" "}
                  {dashboard.appointmentsByStatus.confirmed} confirmadas y{" "}
                  {dashboard.appointmentsByStatus.paid} completadas
                </p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">Siguiente actividad</p>
                <p className="info-box__title">
                  {nextAppointment?.customer ?? "Sin reservas recientes"}
                </p>
                <p className="info-box__text">
                  {nextAppointment
                    ? `${nextAppointment.service} - ${formatDate(nextAppointment.date)}`
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
                    ? `${paymentMethodLabels[latestPayment.method]} - ${formatDate(latestPayment.date)}`
                    : "No hay pagos recientes"}
                </p>
              </div>

              <div className="info-box">
                <p className="info-box__eyebrow">Negocios registrados</p>
                <p className="info-box__title">{businesses.length}</p>
                <p className="info-box__text">Disponibles para nuevas reservas</p>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && activeView === "reservas" ? (
          <div className="page-stack" style={{ gap: 16 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
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
                  <th>Negocio</th>
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
                      <td>{getCustomerName(booking)}</td>
                      <td>{getBusinessName(booking)}</td>
                      <td>
                        <Badge status={booking.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-table-cell">
                      No hay reservas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && activeView === "clientes" ? (
          <div className="page-stack" style={{ gap: 16 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
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
                    <td colSpan={5} className="empty-table-cell">
                      No hay clientes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && activeView === "negocios" ? (
          <div className="page-stack" style={{ gap: 16 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
                {businesses.length} negocios encontrados
              </span>
              <Link className="secondary-btn" href="/businesses">
                Ver pagina de negocios
              </Link>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Horario</th>
                </tr>
              </thead>
              <tbody>
                {businesses.length > 0 ? (
                  businesses.map((business) => (
                    <tr key={business.id}>
                      <td style={{ fontWeight: 600 }}>{business.id}</td>
                      <td>{business.name}</td>
                      <td>{business.email}</td>
                      <td>{business.phone}</td>
                      <td>
                        {business.openingTime} - {business.closingTime}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">
                      No hay negocios registrados.
                    </td>
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
                    <td>{paymentMethodLabels[payment.method]}</td>
                    <td>{formatDate(payment.date)}</td>
                    <td>
                      <Badge status={payment.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-table-cell">
                    No hay pagos recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
