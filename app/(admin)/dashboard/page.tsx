"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AppointmentStatus,
  Business,
  Customer,
  DashboardStats,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";
import type { Booking } from "@/lib/api";
import {
  getAppointments,
  getBusinesses,
  getCustomers,
  getDashboardStats,
  getPayments,
} from "@/lib/api";

import Skeleton from "@/components/ui/Skeleton";
import StatsCard from "@/components/ui/StatsCard";

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  completado: "Completada",
  cancelado: "Cancelada",
};

const appointmentStatusColors: Record<AppointmentStatus, string> = {
  pendiente: "#F59E0B",
  confirmado: "#10B981",
  completado: "#3B82F6",
  cancelado: "#EF4444",
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
  const isPositive = status === "confirmado" || status === "completado" || status === "pagado";
  const isNegative = status === "cancelado" || status === "devolucion" || status === "devolución" || status === "devoluciÃ³n";
  
  const badgeClass = isPositive ? "confirmed" : isNegative ? "paid" : "pending";

  return (
    <span className={`badge badge--${badgeClass}`} style={{ 
      letterSpacing: "0.02em",
      boxShadow: isPositive ? "0 2px 8px rgba(16, 185, 129, 0.15)" : "none"
    }}>
      {labels[status]}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: "64px 32px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.2 }}>📁</div>
      <h4 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>No hay datos disponibles</h4>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "15px" }}>{message}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateStr));
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // Artificial delay for smooth skeleton transition
      if (!isSilent) await new Promise(resolve => setTimeout(resolve, 800));

      const [statsData, bookingsData, paymentsData, customersData] = await Promise.all([
        getDashboardStats(),
        getAppointments(),
        getPayments(),
        getCustomers(),
      ]);
      setDashboard(statsData);
      setBookings(bookingsData);
      setPayments(paymentsData);
      setCustomers(customersData);
      setErrorMessage("");
    } catch {
      setErrorMessage("Error de conexión con el centro de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadDashboard(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const revenueData = useMemo(() => {
    if (!payments.length) return [];
    
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const dayAmount = payments
        .filter(p => p.createdAt.startsWith(day) && p.status === 'pagado')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      return {
        date: formatDate(day),
        amount: dayAmount
      };
    });
  }, [payments]);

  const statusData = useMemo(() => {
    if (!bookings.length) return [];
    const counts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name: appointmentStatusLabels[name as AppointmentStatus],
      value,
      color: appointmentStatusColors[name as AppointmentStatus],
    }));
  }, [bookings]);

  const stats = useMemo(() => {
    if (!dashboard) return null;
    const last7Days = payments.filter(p => {
      const pDate = new Date(p.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return pDate >= sevenDaysAgo;
    });

    const revenueWeek = last7Days.reduce((acc, p) => acc + Number(p.amount), 0);
    const bookingsToday = bookings.filter(b => {
      const bDate = new Date(b.date).toDateString();
      const today = new Date().toDateString();
      return bDate === today;
    }).length;

    // Negocio top
    const businessCounts = bookings.reduce((acc, b) => {
      const name = b.business?.name || "Desconocido";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topBusiness = Object.entries(businessCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      revenueWeek,
      bookingsToday,
      mostActiveBusiness: topBusiness ? topBusiness[0] : "N/A"
    };
  }, [dashboard, payments, bookings]);

  return (
    <div className="page-stack page-transition">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: "40px", margin: 0, fontWeight: 800, letterSpacing: "-0.04em" }}>Resumen Ejecutivo</h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", marginTop: "6px", fontWeight: 500 }}>
            Monitoriza el rendimiento de tu red de negocios en tiempo real.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", position: "relative", zIndex: 2 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            padding: "8px 16px", 
            background: "rgba(16, 185, 129, 0.1)", 
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#10B981"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", animation: "pulse 2s infinite" }} />
            Sistema Activo
          </div>
        </div>

        <div style={{
          position: "absolute",
          top: "10px",
          right: "40px",
          opacity: 0.1,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(-10deg)"
        }}>
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
      </section>

      {errorMessage ? <div className="message-error" style={{ borderRadius: "20px", padding: "20px 24px" }}>{errorMessage}</div> : null}

      <section className="kpi-grid">
        <StatsCard
          loading={loading}
          title="Ingresos (7d)"
          value={formatCurrency(stats?.revenueWeek || 0)}
          subtitle="Ganancia neta semanal"
          trend={{ value: "14.2%", positive: true }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <StatsCard
          loading={loading}
          title="Reservas Hoy"
          value={String(stats?.bookingsToday || 0)}
          subtitle="Citas programadas"
          trend={{ value: "24%", positive: true }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatsCard
          loading={loading}
          title="Negocio Top"
          value={stats?.mostActiveBusiness || "-"}
          subtitle="Mayor volumen de citas"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
        />
        <StatsCard
          loading={loading}
          title="Clientes"
          value={String(customers.length)}
          subtitle="Usuarios activos"
          trend={{ value: "2.1%", positive: true }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "32px" }}>
        {/* Revenue Analytics */}
        <div className="section-card" style={{ padding: "40px", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
            <div>
              <h3 className="panel-title" style={{ fontSize: "22px", marginBottom: "4px" }}>Rendimiento Financiero</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", fontWeight: 500 }}>Ingresos diarios de la última semana.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>{formatCurrency(dashboard?.stats.totalRevenue || 0)}</div>
              <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>TOTAL ACUMULADO</div>
            </div>
          </div>
          
          <div style={{ width: "100%", height: "320px" }}>
            {loading ? (
              <Skeleton width="100%" height="100%" borderRadius="20px" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted)', fontSize: 12, fontWeight: 600}} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--muted)', fontSize: 12, fontWeight: 600}} 
                    tickFormatter={(val) => `€${val}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--surface)', 
                      border: '1.5px solid var(--border)', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      padding: '12px 16px'
                    }}
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                    itemStyle={{ fontWeight: 800, color: 'var(--text)', fontSize: '14px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Appointment Status Pie */}
        <div className="section-card" style={{ padding: "40px", border: "1.5px solid var(--border)" }}>
          <h3 className="panel-title" style={{ fontSize: "22px", marginBottom: "32px" }}>Estado Operativo</h3>
          {loading ? (
             <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
               <Skeleton width="200px" height="200px" borderRadius="50%" />
               <Skeleton width="100%" height="80px" borderRadius="16px" />
             </div>
          ) : bookings.length === 0 ? (
            <EmptyState message="No hay reservas registradas para mostrar estadísticas." />
          ) : (
            <div style={{ width: "100%", height: "320px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 4px 12px ${entry.color}44)` }} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ width: "100%", marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {statusData.map((s, i) => (
                  <div key={i} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    background: "var(--surface-2)", 
                    padding: "10px 14px", 
                    borderRadius: "14px",
                    fontSize: "12px", 
                    fontWeight: 700 
                  }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color }} />
                    <span style={{ color: "var(--muted)", flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: "14px" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr", gap: "32px" }}>
        {/* Activity Feed */}
        <section className="section-card" style={{ padding: "40px", border: "1.5px solid var(--border)" }}>
          <h3 className="panel-title" style={{ fontSize: "22px", marginBottom: "32px" }}>Timeline de Actividad</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", position: "relative" }}>
            <div style={{ 
              position: "absolute", 
              left: "19px", 
              top: "40px", 
              bottom: "40px", 
              width: "2px", 
              background: "var(--border)",
              opacity: 0.5
            }} />
            
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "20px" }}>
                  <Skeleton width="40px" height="40px" borderRadius="12px" />
                  <div style={{ flex: 1 }}><Skeleton width="80%" style={{ marginBottom: "8px" }} /><Skeleton width="40%" height="14px" /></div>
                </div>
              ))
            ) : payments.length === 0 && customers.length === 0 ? (
              <EmptyState message="No se ha detectado actividad reciente." />
            ) : (
              <>
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} style={{ display: "flex", gap: "20px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "12px", 
                      background: payment.status === "pagado" ? "#10B981" : "#F59E0B",
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "16px" }}>
                        Ingreso de {formatCurrency(Number(payment.amount))}
                      </p>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "14px", fontWeight: 500 }}>
                        {payment.status === "pagado" ? "Cobro confirmado" : "Pendiente de cobro"} • {new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
                {customers.slice(0, 2).map((customer) => (
                  <div key={customer.id} style={{ display: "flex", gap: "20px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "12px", 
                      background: "var(--primary)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--primary-text)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "16px" }}>Nuevo cliente a bordo</p>
                      <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "14px", fontWeight: 500 }}>
                        {customer.name} se ha unido al sistema.
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Recent Transactions Table */}
        <section className="section-card" style={{ padding: 0, overflow: "hidden", border: "1.5px solid var(--border)" }}>
          <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 className="panel-title" style={{ fontSize: "22px" }}>Últimas Operaciones</h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px", fontWeight: 600 }}>GESTIÓN DE RESERVAS EN TIEMPO REAL</p>
            </div>
            <Link href="/bookings" className="secondary-btn" style={{ fontSize: "13px", padding: "8px 20px" }}>Ver historial completo</Link>
          </div>
          
          {loading ? (
            <div style={{ padding: "40px" }}>
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} width="100%" height="48px" style={{ marginBottom: "12px" }} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState message="No se han encontrado registros de operaciones." />
          ) : (
            <table className="data-table">
              <thead style={{ background: "var(--surface-2)" }}>
                <tr>
                  <th style={{ paddingLeft: "40px" }}>Detalle</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th style={{ paddingRight: "40px", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 6).map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ paddingLeft: "40px" }}>
                      <div style={{ fontWeight: 800, fontSize: "15px" }}>{booking.customer?.name || "Cliente"}</div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>{booking.serviceName}</div>
                    </td>
                    <td style={{ color: "var(--muted)", fontWeight: 600, fontSize: "14px" }}>{formatDate(booking.date)}</td>
                    <td><Badge status={booking.status} /></td>
                    <td style={{ paddingRight: "40px", textAlign: "right" }}>
                      <Link href={`/bookings`} style={{ color: "var(--primary)", fontWeight: 800, fontSize: "13px", textDecoration: "none" }}>Detalles</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
