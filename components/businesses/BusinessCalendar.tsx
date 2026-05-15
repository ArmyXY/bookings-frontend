"use client";

import { useMemo, useState } from "react";
import type { Appointment, Business } from "@/lib/types";

interface BusinessCalendarProps {
  business: Business;
  appointments: Appointment[];
  onClose: () => void;
}

export default function BusinessCalendar({ business, appointments, onClose }: BusinessCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ day: number; date: string; appointments: Appointment[] } | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const isFull = (dayAppointments: Appointment[]) => {
    try {
      const start = parseInt(business.openingTime.split(":")[0]);
      const end = parseInt(business.closingTime.split(":")[0]);
      const availableSlots = Math.max(1, end - start);
      return dayAppointments.length >= availableSlots;
    } catch {
      return dayAppointments.length >= 8;
    }
  };

  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to Monday start

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, date: null });
    }
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayAppointments = appointments.filter((a) => a.date.startsWith(dateStr));
      days.push({ day: i, date: dateStr, appointments: dayAppointments });
    }
    return days;
  }, [viewDate, appointments]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const today = new Date();
  const isToday = (day: number | null) => {
    return day === today.getDate() && 
           viewDate.getMonth() === today.getMonth() && 
           viewDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: "1000px", width: "95%", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", height: "auto", minHeight: "650px" }}>
          {/* Calendar Grid */}
          <div style={{ flex: 1, padding: "40px", background: "var(--surface)" }}>
            <div className="panel-title-row" style={{ marginBottom: "32px" }}>
              <div>
                <h3 className="modal-title" style={{ margin: 0, textAlign: "left", fontSize: "28px" }}>
                  Calendario: {business.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                   <p style={{ color: "var(--muted)", fontSize: "16px", fontWeight: 600, margin: 0 }}>
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </p>
                  <button 
                    className="secondary-btn" 
                    onClick={() => setViewDate(new Date())}
                    style={{ padding: "4px 12px", fontSize: "12px" }}
                  >
                    Hoy
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button className="secondary-btn" onClick={() => changeMonth(-1)} style={{ padding: "12px", borderRadius: "12px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button className="secondary-btn" onClick={() => changeMonth(1)} style={{ padding: "12px", borderRadius: "12px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" }}>
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "13px", fontWeight: 800, color: "var(--muted-2)", paddingBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {d}
                </div>
              ))}
              {monthData.map((d, i) => {
                const full = d.appointments ? isFull(d.appointments) : false;
                const hasApts = d.appointments && d.appointments.length > 0;
                const active = selectedDay?.day === d.day;
                const isDayToday = isToday(d.day);

                return (
                  <div
                    key={i}
                    onClick={() => d.day && setSelectedDay({ day: d.day, date: d.date!, appointments: d.appointments || [] })}
                    style={{
                      aspectRatio: "1/1",
                      borderRadius: "20px",
                      border: d.day ? "2px solid var(--border)" : "none",
                      background: d.day ? (active ? "var(--primary)" : isDayToday ? "var(--primary-soft)" : "var(--surface)") : "transparent",
                      padding: "12px",
                      cursor: d.day ? "pointer" : "default",
                      position: "relative",
                      transition: "all 0.3s var(--ease-out-expo)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderColor: active ? "var(--primary)" : d.day ? "var(--border)" : "transparent",
                      color: active ? "var(--primary-text)" : "inherit",
                    }}
                    className={d.day ? "calendar-day-node" : ""}
                  >
                    {d.day && (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "16px", fontWeight: 800 }}>{d.day}</span>
                          {full && (
                            <div style={{ 
                              width: "10px", 
                              height: "10px", 
                              borderRadius: "50%", 
                              background: "#FF3B30",
                              boxShadow: "0 0 8px rgba(255, 59, 48, 0.4)"
                            }} title="Día completo" />
                          )}
                        </div>
                        
                        {hasApts && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ 
                              height: "6px", 
                              width: "100%", 
                              borderRadius: "3px", 
                              background: active ? "rgba(0,0,0,0.2)" : (full ? "#FF3B30" : "var(--primary)"),
                              opacity: active ? 1 : 0.8
                            }} />
                            <span style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8 }}>
                              {d.appointments!.length} {d.appointments!.length === 1 ? "cita" : "citas"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Sidebar */}
          <div style={{ 
            width: "360px", 
            background: "var(--surface-2)", 
            borderLeft: "2px solid var(--border)",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "inset 10px 0 30px rgba(0,0,0,0.02)"
          }}>
            <div style={{ marginBottom: "32px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800 }}>
                {selectedDay ? `Día ${selectedDay.day}` : "Actividad"}
              </h4>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", fontWeight: 500 }}>
                {selectedDay ? `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}` : "Selecciona una fecha para ver los detalles"}
              </p>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }} className="custom-scrollbar">
              {selectedDay && selectedDay.appointments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedDay.appointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                    <div key={apt.id} style={{ 
                      padding: "20px", 
                      background: "var(--surface)", 
                      borderRadius: "24px", 
                      border: "2px solid var(--border)",
                      transition: "transform 0.2s ease",
                      cursor: "default"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ 
                          fontSize: "12px", 
                          fontWeight: 800, 
                          color: "var(--primary-text)",
                          background: "var(--primary)",
                          padding: "4px 10px",
                          borderRadius: "100px"
                        }}>{apt.time}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase" }}>#{apt.id}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>{apt.serviceName}</div>
                      <div style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 600 }}>{apt.customer?.name || "Cliente no registrado"}</div>
                    </div>
                  ))}
                </div>
              ) : selectedDay ? (
                <div style={{ textAlign: "center", marginTop: "60px", padding: "20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.2 }}>📅</div>
                  <p style={{ color: "var(--muted)", fontWeight: 600 }}>No hay citas programadas para este día.</p>
                </div>
              ) : (
                <div style={{ textAlign: "center", marginTop: "60px", padding: "20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.1 }}>🖱️</div>
                  <p style={{ color: "var(--muted)", fontWeight: 600 }}>Haz clic en un día para ver el listado de citas.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {selectedDay && isFull(selectedDay.appointments) && (
                <div style={{ 
                  background: "#FFEBE9", 
                  color: "#D73A49", 
                  padding: "12px 16px", 
                  borderRadius: "16px", 
                  fontSize: "13px", 
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D73A49" }} />
                  Día completo (Capacidad máxima)
                </div>
              )}
              <button className="primary-btn" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
                Cerrar calendario
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .calendar-day-node:hover {
          border-color: var(--primary) !important;
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
