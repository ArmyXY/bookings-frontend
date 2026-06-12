"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { Appointment, Business } from "@/lib/types";
import ModalPortal from "@/components/ui/ModalPortal";
import gsap from "gsap";

interface BusinessCalendarProps {
  business: Business;
  appointments: Appointment[];
  onClose: () => void;
}

export default function BusinessCalendar({ business, appointments, onClose }: BusinessCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<{ day: number; date: string; appointments: Appointment[] }[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Model's Signature Cinematic "3D Unfold" Reveal Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (backdropRef.current && cardRef.current) {
        // Step 1: Initialize the card as a sleek, narrow horizontal slit in 3D space
        gsap.set(backdropRef.current, { opacity: 0 });
        gsap.set(cardRef.current, {
          scaleY: 0.05,
          scaleX: 0.8,
          opacity: 0,
          y: 60,
          rotationX: 20,
          transformPerspective: 1000,
        });

        // Step 2: Unfold it into a gorgeous full panel with buttery ease-out deceleration
        const tl = gsap.timeline();
        tl.to(backdropRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        })
          .to(cardRef.current, {
            scaleY: 1,
            scaleX: 1,
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.75,
            ease: "power4.out", // Luxurious, silky deceleration
          }, "-=0.25");
      }
    });
    return () => ctx.revert();
  }, []);

  // Cinematic "3D Refold & Sink" Exit Animation before unmounting
  const handleClose = () => {
    if (backdropRef.current && cardRef.current) {
      const tl = gsap.timeline({
        onComplete: onClose,
      });

      tl.to(cardRef.current, {
        scaleY: 0.05,
        scaleX: 0.8,
        opacity: 0,
        y: 60,
        rotationX: -20,
        transformPerspective: 1000,
        duration: 0.45,
        ease: "power4.in",
      })
        .to(backdropRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut",
        }, "-=0.35");
    } else {
      onClose();
    }
  };

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
    const startOffset = (firstDayOfMonth(year, month) + 6) % 7;

    const days: { day: number | null; date: string | null; appointments?: Appointment[] }[] = [];
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
    setSelectedDays([]);
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const today = new Date();
  const isToday = (day: number | null) =>
    day === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  return (
    <ModalPortal>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "grid",
          placeItems: "center",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px) saturate(180%)",
          padding: "24px",
          animation: "none",
        }}
      >
        {/* Calendar card */}
        <div
          ref={cardRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "1000px",
            width: "95%",
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transformOrigin: "center center",
            animation: "none",
          }}
        >
          <div style={{ display: "flex", minHeight: "650px" }}>
            {/* ── Left: Calendar Grid ── */}
            <div style={{ flex: 1, padding: "40px", background: "var(--surface)" }}>
              <div className="panel-title-row" style={{ marginBottom: "32px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>
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
                  <button
                    className="secondary-btn"
                    onClick={() => changeMonth(-1)}
                    style={{ padding: "12px", borderRadius: "12px" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => changeMonth(1)}
                    style={{ padding: "12px", borderRadius: "12px" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" }}>
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "var(--muted-2)",
                      paddingBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {d}
                  </div>
                ))}

                {/* Day cells */}
                {monthData.map((d, i) => {
                  const full = d.appointments ? isFull(d.appointments) : false;
                  const hasApts = d.appointments && d.appointments.length > 0;
                  const active = d.date ? selectedDays.some(sd => sd.date === d.date) : false;
                  const isDayToday = isToday(d.day);

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (d.day && d.date) {
                          const dayObj = { day: d.day, date: d.date, appointments: d.appointments || [] };
                          if (isMultiSelect) {
                            setSelectedDays(prev => {
                              const exists = prev.find(p => p.date === dayObj.date);
                              if (exists) {
                                return prev.filter(p => p.date !== dayObj.date);
                              } else {
                                return [...prev, dayObj];
                              }
                            });
                          } else {
                            setSelectedDays([dayObj]);
                          }
                        }
                      }}
                      className={d.day ? "calendar-day-node" : ""}
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: "20px",
                        border: d.day ? "2px solid var(--border)" : "none",
                        background: d.day
                          ? active
                            ? "var(--primary)"
                            : isDayToday
                              ? "var(--primary-soft)"
                              : "var(--surface)"
                          : "transparent",
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
                    >
                      {d.day && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "16px", fontWeight: 800 }}>{d.day}</span>
                            {full && (
                              <div
                                title="Día completo"
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  background: "#FF3B30",
                                  boxShadow: "0 0 8px rgba(255,59,48,0.4)",
                                }}
                              />
                            )}
                          </div>
                          {hasApts && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div
                                style={{
                                  height: "6px",
                                  width: "100%",
                                  borderRadius: "3px",
                                  background: active ? "rgba(0,0,0,0.2)" : full ? "#FF3B30" : "var(--primary)",
                                  opacity: active ? 1 : 0.8,
                                }}
                              />
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

            {/* ── Right: Details Sidebar ── */}
            <div
              style={{
                width: "360px",
                background: "var(--surface-2)",
                borderLeft: "2px solid var(--border)",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800 }}>
                      {selectedDays.length > 0
                        ? selectedDays.length === 1
                          ? `Día ${selectedDays[0].day}`
                          : `${selectedDays.length} días`
                        : "Actividad"}
                    </h4>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", fontWeight: 500 }}>
                      {selectedDays.length > 0
                        ? `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`
                        : "Selecciona una fecha para ver"}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMultiSelect(!isMultiSelect);
                      if (isMultiSelect && selectedDays.length > 1) {
                        setSelectedDays([selectedDays[0]]);
                      }
                    }}
                    style={{
                      background: isMultiSelect ? "var(--primary)" : "var(--surface)",
                      color: isMultiSelect ? "var(--primary-text)" : "var(--text)",
                      border: "2px solid",
                      borderColor: isMultiSelect ? "var(--primary)" : "var(--border)",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    title="Selección múltiple"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      {isMultiSelect && <path d="M9 12l2 2 4-4"></path>}
                    </svg>
                    Múltiple
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }} className="custom-scrollbar">
                {selectedDays.length > 0 && selectedDays.some(sd => sd.appointments.length > 0) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {selectedDays
                      .flatMap(sd => sd.appointments.map(apt => ({ ...apt, _date: sd.date, _day: sd.day })))
                      .sort((a, b) => {
                        if (a._date !== b._date) return a._date.localeCompare(b._date);
                        return a.time.localeCompare(b.time);
                      })
                      .map((apt) => (
                        <div
                          key={`${apt.id}-${apt._date}`}
                          style={{
                            padding: "20px",
                            background: "var(--surface)",
                            borderRadius: "24px",
                            border: "2px solid var(--border)",
                            transition: "transform 0.2s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              {selectedDays.length > 1 && (
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "var(--muted)",
                                  background: "var(--surface-2)",
                                  padding: "4px 8px",
                                  borderRadius: "100px",
                                }}>
                                  Día {apt._day}
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  color: "var(--primary-text)",
                                  background: "var(--primary)",
                                  padding: "4px 10px",
                                  borderRadius: "100px",
                                }}
                              >
                                {apt.time}
                              </span>
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase" }}>
                              #{apt.id}
                            </span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>{apt.serviceName}</div>
                          <div style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 600 }}>
                            {apt.customer?.name || "Cliente no registrado"}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : selectedDays.length > 0 ? (
                  <div style={{ textAlign: "center", marginTop: "60px", padding: "20px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.2 }}>📅</div>
                    <p style={{ color: "var(--muted)", fontWeight: 600 }}>No hay citas programadas en los días seleccionados.</p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", marginTop: "60px", padding: "20px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.1 }}>🖱️</div>
                    <p style={{ color: "var(--muted)", fontWeight: 600 }}>Haz clic en un día para ver el listado de citas.</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedDays.length > 0 && selectedDays.some(sd => isFull(sd.appointments)) && (
                  <div
                    style={{
                      background: "#FFEBE9",
                      color: "#D73A49",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D73A49" }} />
                    {selectedDays.length > 1 ? "Hay días completos" : "Día completo (Capacidad máxima)"}
                  </div>
                )}
                <button
                  className="primary-btn"
                  onClick={handleClose}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Cerrar calendario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .calendar-day-node:hover {
          border-color: var(--primary) !important;
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
    </ModalPortal>
  );
}
