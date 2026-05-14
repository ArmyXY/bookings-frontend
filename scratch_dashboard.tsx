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
  const icon = 
    title.includes("Ingresos") ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ) :
    title.includes("Reservas") ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ) :
    title.includes("Clientes") ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );

  return (
    <div className="kpi-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="kpi-card__label">{title}</p>
        <span style={{ color: "var(--primary)", opacity: 0.8 }}>{icon}</span>
      </div>
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
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Panel de control</h2>
          <p>Control diario de reservas, clientes y cobros.</p>
        </div>
        <div style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          opacity: 0.15,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(-15deg)"
        }}>
          <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
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
        <div className="panel-title-row" style={{ marginBottom: "48px" }}>
          <h3 className="panel-title">
            {activeView === "reservas"
              ? "Reservas registradas"
              : activeView === "clientes"
                ? "Directorio de clientes"
                : activeView === "pagos"
                  ? "Pagos recientes"
                  : "Panel de Resumen"}
          </h3>
          <div className="filter-row">
            <button
              className={`filter-pill ${activeView === "resumen" ? "filter-pill--active" : ""}`}
              type="button"
              onClick={() => setActiveView("resumen")}
            >
              Resumen
            </button>
            <button
              className={`filter-pill ${activeView === "reservas" ? "filter-pill--active" : ""}`}
              type="button"
              onClick={() => setActiveView("reservas")}
            >
              Reservas
            </button>
            <button
              className={`filter-pill ${activeView === "clientes" ? "filter-pill--active" : ""}`}
              type="button"
              onClick={() => setActiveView("clientes")}
            >
              Clientes
            </button>
            <button
              className={`filter-pill ${activeView === "pagos" ? "filter-pill--active" : ""}`}
              type="button"
              onClick={() => setActiveView("pagos")}
            >
              Pagos
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
            <div className="spinner"></div>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>SINCRONIZANDO DATOS...</span>
          </div>
        ) : null}

        {!loading && dashboard && activeView === "resumen" ? (
          <div className="page-stack" style={{ gap: "40px" }}>
            <div className="info-box" style={{ 
              background: "var(--surface-2)", 
              border: "1.5px solid var(--border)", 
              borderRadius: "var(--radius-lg)",
              padding: "48px",
              boxShadow: "var(--shadow-sm)"
            }}>
              <p className="info-box__eyebrow" style={{ letterSpacing: "0.1em" }}>ESTADO GLOBAL</p>
              <h4 style={{ margin: "12px 0", fontSize: "28px", fontWeight: 800 }}>Resumen de actividad reciente</h4>
              <p className="info-box__text" style={{ fontSize: "16px", color: "var(--muted)" }}>
                Vista detallada de las últimas operaciones registradas en el sistema.
              </p>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Fecha</th>
                  <th>Importe / Estado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentActivity.appointments.slice(0, 3).map((apt, i) => (
                  <tr key={`apt-${i}`}>
                    <td><span className="badge badge--confirmed" style={{ fontSize: "10px" }}>RESERVA</span></td>
                    <td style={{ fontWeight: 600 }}>{apt.customer} - {apt.service}</td>
                    <td>{formatDate(apt.date)}</td>
                    <td><Badge status="confirmed" /></td>
                  </tr>
                ))}
                {dashboard.recentActivity.payments.slice(0, 3).map((pay, i) => (
                  <tr key={`pay-${i}`}>
                    <td><span className="badge badge--paid" style={{ fontSize: "10px" }}>PAGO</span></td>
                    <td style={{ fontWeight: 600 }}>Cobro registrado ({paymentMethodLabel(pay.method)})</td>
                    <td>{formatDate(pay.date)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(Number(pay.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && activeView === "reservas" ? (
          <div className="page-stack" style={{ gap: 24 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
                {bookings.length.toString().padStart(2, '0')} RESERVAS ENCONTRADAS
              </span>
              <Link className="secondary-btn" href="/bookings">
                Ver página completa
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
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ fontWeight: 700, color: "var(--muted)" }}>#{booking.id}</td>
                      <td>{formatDate(booking.date)}</td>
                      <td>{booking.time}</td>
                      <td style={{ fontWeight: 600 }}>{booking.serviceName}</td>
                      <td>ID: {booking.customerId}</td>
                      <td>
                        <Badge status={booking.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>No hay reservas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && activeView === "clientes" ? (
          <div className="page-stack" style={{ gap: 32 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
                {customers.length.toString().padStart(2, '0')} CLIENTES ACTIVOS
              </span>
              <Link className="secondary-btn" href="/customers">
                Administrar Directorio
              </Link>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
              gap: "24px" 
            }}>
              {customers.map((customer) => (
                <div key={customer.id} className="surface-card" style={{ 
                  padding: "24px", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  textAlign: "center",
                  gap: "16px",
                  border: "1.5px solid var(--border)"
                }}>
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%", 
                    background: "var(--surface-2)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "var(--primary)",
                    border: "2px solid var(--border)"
                  }}>
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>{customer.name}</h4>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{customer.email}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>
                      {customer.phone || "Sin teléfono registrado"}
                    </p>
                  </div>
                  <div style={{ 
                    marginTop: "8px",
                    padding: "8px 16px",
                    borderRadius: "100px",
                    background: "var(--bg)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--muted)"
                  }}>
                    ID: #{customer.id.toString().padStart(3, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && dashboard && activeView === "pagos" ? (
          <div className="page-stack" style={{ gap: 24 }}>
            <div className="panel-title-row" style={{ marginBottom: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
                {dashboard.recentActivity.payments.length.toString().padStart(2, '0')} OPERACIONES RECIENTES
              </span>
              <Link className="secondary-btn" href="/payments">
                Ir a Pagos
              </Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Importe</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentActivity.payments.length > 0 ? (
                  dashboard.recentActivity.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td style={{ fontWeight: 700, color: "var(--muted)" }}>#PY-{String(payment.id).padStart(3, '0')}</td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(Number(payment.amount))}</td>
                      <td style={{ textTransform: "uppercase", fontSize: "12px", fontWeight: 700 }}>{paymentMethodLabel(payment.method)}</td>
                      <td>{formatDate(payment.date)}</td>
                      <td>
                        <Badge status={payment.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "48px" }}>No hay pagos recientes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
