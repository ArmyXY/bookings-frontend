"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/api";
import {
  createAppointment,
  createCustomer,
  deleteAppointment,
  getBusinesses,
  getCustomers,
  updateAppointment,
  updatePayment,
} from "@/lib/api";
import { PaymentMethod, type Business, type Customer } from "@/lib/types";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import StatsCard from "@/components/ui/StatsCard";
import ModalPortal from "@/components/ui/ModalPortal";

const statusLabels: Record<BookingStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  completado: "Completada",
  cancelado: "Cancelada",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CARD]: "Tarjeta",
  [PaymentMethod.TRANSFER]: "Transferencia",
};

const emptyForm: CreateBookingDto = {
  date: "",
  time: "",
  status: "pendiente",
  customerId: 0,
  businessId: 0,
  serviceName: "",
  paymentMethod: PaymentMethod.CASH,
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const badgeStatus =
    status === "confirmado" || status === "completado"
      ? "confirmed"
      : status === "cancelado"
        ? "paid"
        : "pending";

  return <span className={`badge badge--${badgeStatus}`}>{statusLabels[status]}</span>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function buildHourlySlots(business: Business) {
  const [openHour, openMinute] = business.openingTime.split(":").map(Number);
  const [closeHour, closeMinute] = business.closingTime.split(":").map(Number);
  const open = openHour * 60 + openMinute;
  const close = closeHour * 60 + closeMinute;
  const slots: string[] = [];

  for (let minute = open; minute < close; minute += 60) {
    const hour = Math.floor(minute / 60);
    const minutes = minute % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  }

  return slots.length ? slots : [business.openingTime.slice(0, 5)];
}

function getCustomerName(booking: Booking) {
  return booking.customer?.name ?? `Cliente #${booking.customerId}`;
}

function getBusinessName(booking: Booking) {
  return booking.business?.name ?? `Negocio #${booking.businessId}`;
}

function getPaymentMethodLabel(booking: Booking) {
  const method = booking.payments?.[0]?.method;
  return method ? paymentMethodLabels[method] : "Pendiente";
}

function getPendingPayment(booking: Booking) {
  return booking.payments?.find((payment) => payment.status !== "pagado") ?? null;
}

export default function BookingsClient({
  initialBookings,
  initialError = "",
}: {
  initialBookings: Booking[];
  initialError?: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [businessActionId, setBusinessActionId] = useState<number | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const clientPageRef = useRef<HTMLDivElement>(null);
  const clientBookingPanelRef = useRef<HTMLElement>(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isClient = Boolean(user?.isClient);
  const isBusiness = user?.role === "business";

  useEffect(() => {
    async function loadRelations() {
      try {
        const [loadedCustomers, businessesData] = await Promise.all([
          getCustomers(),
          getBusinesses(),
        ]);
        let customersData = loadedCustomers;
        let defaultCustomerId = customersData[0]?.id ?? 0;

        if (isClient && user) {
          let clientCustomer = customersData.find(
            (customer) => customer.email.toLowerCase() === user.email.toLowerCase()
          );

          if (!clientCustomer) {
            clientCustomer = await createCustomer({
              name: user.name,
              email: user.email,
            });
            customersData = [clientCustomer, ...customersData];
          }

          defaultCustomerId = clientCustomer.id;
          setCurrentCustomer(clientCustomer);
        }

        setCustomers(customersData);
        setBusinesses(businessesData);
        setSelectedBusinessId(businessesData[0]?.id ?? null);
        setCreateForm((prev) => ({
          ...prev,
          customerId: defaultCustomerId,
          businessId: businessesData[0]?.id ?? 0,
          date: prev.date || getTodayValue(),
        }));
      } catch {
        setErrorMessage("No se pudieron cargar clientes o negocios para las reservas.");
      }
    }

    loadRelations();
  }, [isClient, user]);

  useEffect(() => {
    if (!isClient || !clientPageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".client-animated",
        { opacity: 0, y: 18, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.08,
        }
      );
    }, clientPageRef);

    return () => ctx.revert();
  }, [isClient, businesses.length]);

  useEffect(() => {
    if (!isClient || !isCreateOpen || !clientBookingPanelRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        clientBookingPanelRef.current,
        { opacity: 0, y: 22, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
      );
    });

    return () => ctx.revert();
  }, [isClient, isCreateOpen, selectedBusinessId]);

  const filteredBookings = useMemo(() => {
    if (isClient && !currentCustomer) return [];
    if (isBusiness && !user?.businessId) return [];
    const roleBookings =
      isClient && currentCustomer
        ? bookings.filter((booking) => booking.customerId === currentCustomer.id)
        : isBusiness
        ? bookings.filter((booking) => booking.businessId === user?.businessId)
        : bookings;
    if (statusFilter === "all") return roleBookings;
    return roleBookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, currentCustomer, isBusiness, isClient, statusFilter, user?.businessId]);

  const visibleBookings = useMemo(
    () =>
      isClient && !currentCustomer
        ? []
        : isBusiness && !user?.businessId
        ? []
        : isClient && currentCustomer
        ? bookings.filter((booking) => booking.customerId === currentCustomer.id)
        : isBusiness
        ? bookings.filter((booking) => booking.businessId === user?.businessId)
        : bookings,
    [bookings, currentCustomer, isBusiness, isClient, user?.businessId]
  );

  const counts = useMemo(
    () => ({
      total: visibleBookings.length,
      pending: visibleBookings.filter((booking) => booking.status === "pendiente").length,
      confirmed: visibleBookings.filter((booking) => booking.status === "confirmado").length,
      paid: visibleBookings.filter((booking) => booking.status === "completado").length,
    }),
    [visibleBookings]
  );

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId]
  );

  const selectedDayBookings = useMemo(() => {
    if (!selectedBusiness || !createForm.date) return [];
    return bookings.filter(
      (booking) =>
        booking.businessId === selectedBusiness.id &&
        booking.date.startsWith(createForm.date)
    );
  }, [bookings, createForm.date, selectedBusiness]);

  const availableSlots = useMemo(() => {
    if (!selectedBusiness) return [];
    const bookedTimes = new Set(
      selectedDayBookings.map((booking) => booking.time.slice(0, 5))
    );

    return buildHourlySlots(selectedBusiness).map((slot) => ({
      value: slot,
      isBooked: bookedTimes.has(slot),
    }));
  }, [selectedBusiness, selectedDayBookings]);

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetCreateForm() {
    setCreateForm({
      ...emptyForm,
      customerId: currentCustomer?.id ?? customers[0]?.id ?? 0,
      businessId: businesses[0]?.id ?? 0,
    });
  }

  function resetEditForm() {
    setEditForm(emptyForm);
  }

  function openCreateForm() {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    setIsCreateOpen(true);
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  function selectBusiness(business: Business) {
    setSelectedBusinessId(business.id);
    setSuccessMessage("");
    setErrorMessage("");
    setIsCreateOpen(true);
    setCreateForm((prev) => ({
      ...prev,
      businessId: business.id,
      customerId: currentCustomer?.id ?? prev.customerId,
      date: prev.date || getTodayValue(),
      time: "",
    }));
  }

  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: booking.serviceName,
    });
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() {
    setDeleteTargetId(null);
  }

  const { addNotification } = useNotifications();

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        ...createForm,
        status: isClient ? "pendiente" as BookingStatus : createForm.status,
        customerId: currentCustomer?.id ?? createForm.customerId,
      };
      const created = await createAppointment(payload);
      const enrichedCreated = {
        ...created,
        customer: currentCustomer ?? created.customer,
        business: businesses.find((business) => business.id === created.businessId) ?? created.business,
      };
      setBookings((prev) => [enrichedCreated, ...prev]);
      resetCreateForm();
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
      addNotification({
        title: "Reserva Creada",
        description: `Nueva reserva para "${created.serviceName}" registrada con éxito.`,
        type: "success"
      });
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa horario, cliente y negocio.");
      addNotification({
        title: "Error en Reserva",
        description: "No se pudo registrar la nueva reserva.",
        type: "error"
      });
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBookingId) return;

    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        customerId: editForm.customerId,
        businessId: editForm.businessId,
        serviceName: editForm.serviceName,
      };
      const updated = await updateAppointment(editingBookingId, payload);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBookingId
            ? {
                ...booking,
                ...updated,
                customer: booking.customer,
                business:
                  businesses.find((business) => business.id === updated.businessId) ??
                  booking.business,
              }
            : booking
        )
      );
      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
      addNotification({
        title: "Reserva Modificada",
        description: `La reserva #${editingBookingId} ha sido actualizada.`,
        type: "success"
      });
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
      addNotification({
        title: "Error al Editar",
        description: "Hubo un problema al guardar los cambios de la reserva.",
        type: "error"
      });
    } finally {
      setLoadingEdit(false);
    }
  }

  async function handleBusinessStatus(booking: Booking, status: Extract<BookingStatus, "confirmado" | "cancelado">) {
    if (!isBusiness || booking.businessId !== user?.businessId) return;

    setBusinessActionId(booking.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updated = await updateAppointment(booking.id, { status });
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                ...updated,
                customer: item.customer,
                business: item.business,
                payments: item.payments,
              }
            : item
        )
      );
      setSuccessMessage(`Reserva ${status === "confirmado" ? "confirmada" : "cancelada"} correctamente.`);
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setBusinessActionId(null);
    }
  }

  async function handleBusinessPayment(booking: Booking) {
    if (!isBusiness || booking.businessId !== user?.businessId) return;
    const payment = getPendingPayment(booking);
    if (!payment) return;

    setBusinessActionId(booking.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updatedPayment = await updatePayment(payment.id, { status: "pagado" });
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                status: "completado",
                payments: item.payments?.map((existingPayment) =>
                  existingPayment.id === updatedPayment.id ? updatedPayment : existingPayment
                ),
              }
            : item
        )
      );
      setSuccessMessage("Pago confirmado correctamente.");
    } catch {
      setErrorMessage("No se pudo confirmar el pago.");
    } finally {
      setBusinessActionId(null);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));
      if (editingBookingId === deleteTargetId) closeEditForm();
      setSuccessMessage("Reserva eliminada correctamente.");
      addNotification({
        title: "Reserva Eliminada",
        description: `La reserva #${deleteTargetId} ha sido eliminada.`,
        type: "info"
      });
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
      addNotification({
        title: "Error al Eliminar",
        description: "No se pudo borrar la reserva seleccionada.",
        type: "error"
      });
    } finally {
      setDeletingBookingId(null);
    }
  }

  function renderBookingForm(
    form: CreateBookingDto,
    updateForm: <K extends keyof CreateBookingDto>(key: K, value: CreateBookingDto[K]) => void,
    includePaymentMethod = false
  ) {
    return (
      <div className="form-grid">
        <input
          className="input"
          type="date"
          value={form.date}
          onChange={(e) => updateForm("date", e.target.value)}
          required
        />
        <input
          className="input"
          type="time"
          value={form.time}
          onChange={(e) => updateForm("time", e.target.value)}
          required
        />
        {!isClient ? <select
          className="select"
          value={form.status}
          onChange={(e) => updateForm("status", e.target.value as BookingStatus)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select> : null}
        {!isClient ? <select
          className="select"
          value={form.customerId}
          onChange={(e) => updateForm("customerId", Number(e.target.value))}
          required
        >
          <option value={0}>Selecciona cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select> : null}
        <select
          className="select"
          value={form.businessId}
          onChange={(e) => updateForm("businessId", Number(e.target.value))}
          required
        >
          <option value={0}>Selecciona negocio</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name} ({business.openingTime}-{business.closingTime})
            </option>
          ))}
        </select>
        <input
          className="input input--full"
          type="text"
          value={form.serviceName}
          onChange={(e) => updateForm("serviceName", e.target.value)}
          placeholder="Servicio"
          required
        />
        {includePaymentMethod ? (
          <select
            className="select input--full"
            value={form.paymentMethod ?? PaymentMethod.CASH}
            onChange={(e) => updateForm("paymentMethod", e.target.value as PaymentMethod)}
            required
          >
            <option value={PaymentMethod.CASH}>Metodo de pago: Efectivo</option>
            <option value={PaymentMethod.CARD}>Metodo de pago: Tarjeta</option>
            <option value={PaymentMethod.TRANSFER}>Metodo de pago: Transferencia</option>
          </select>
        ) : null}
      </div>
    );
  }

  if (isClient) {
    return (
      <div ref={clientPageRef} className="page-stack page-transition client-bookings-page">
        <section className="client-hero-soft client-animated">
          <div>
            <span className="client-kicker">✨ Area de cliente</span>
            <h2>Reservar cita ⚡</h2>
            <p>Elige un negocio, selecciona fecha y hora, y consulta tus reservas desde esta misma pantalla.</p>
          </div>

          <div className="client-session-card">
            <div className="client-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "C"}</div>
            <div>
              <strong>{user?.name ?? "Cliente"}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="client-theme-btn"
              onClick={toggleTheme}
              title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              {theme === "light" ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <button type="button" className="secondary-btn client-logout-btn" onClick={logout}>
              Cerrar sesion
            </button>
          </div>
        </section>

        {successMessage ? <div className="message-success">{successMessage}</div> : null}
        {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

        <section className="section-card client-animated">
          <div className="panel-title-row">
            <h3 className="panel-title">🏢 Negocios disponibles</h3>
            <span style={{ color: "var(--muted)", fontWeight: 800 }}>
              {businesses.length} disponibles
            </span>
          </div>

          <div className="client-business-grid">
            {businesses.map((business, index) => (
              <button
                key={business.id}
                type="button"
                className={`client-business-tile client-business-tile--tone-${index % 4} client-animated ${selectedBusinessId === business.id ? "client-business-tile--active" : ""}`}
                onClick={() => selectBusiness(business)}
              >
                <span className="client-business-tile__title">⚡ {business.name}</span>
                <span className="client-business-tile__address">{business.address}</span>
                <span className="client-business-tile__hours">
                  🕒 {business.openingTime} - {business.closingTime}
                </span>
              </button>
            ))}
          </div>
        </section>

        {selectedBusiness && isCreateOpen ? (
          <section ref={clientBookingPanelRef} className="section-card client-booking-panel">
            <div className="panel-title-row">
              <div>
                <h3 className="panel-title">📅 Calendario de {selectedBusiness.name}</h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                  Selecciona fecha, hora y servicio para solicitar tu reserva.
                </p>
              </div>
              <button type="button" className="secondary-btn" onClick={closeCreateForm}>
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 20 }}>
              <div className="form-grid">
                <input
                  className="input"
                  type="date"
                  min={getTodayValue()}
                  value={createForm.date}
                  onChange={(e) => updateCreateForm("date", e.target.value)}
                  required
                />
                <input
                  className="input"
                  type="text"
                  value={createForm.serviceName}
                  onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                  placeholder="Servicio"
                  required
                />
                <select
                  className="select"
                  value={createForm.paymentMethod ?? PaymentMethod.CASH}
                  onChange={(e) => updateCreateForm("paymentMethod", e.target.value as PaymentMethod)}
                  required
                >
                  <option value={PaymentMethod.CASH}>Pago en efectivo</option>
                  <option value={PaymentMethod.CARD}>Pago con tarjeta</option>
                  <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                </select>
              </div>

              <div className="client-slots-grid">
                {availableSlots.map((slot, index) => (
                  <button
                    key={slot.value}
                    type="button"
                    className={`client-slot client-slot--tone-${index % 4} ${createForm.time === slot.value ? "client-slot--active" : ""}`}
                    disabled={slot.isBooked}
                    onClick={() => updateCreateForm("time", slot.value)}
                  >
                    {slot.value}
                  </button>
                ))}
              </div>

              <div className="message-row">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={loadingCreate || !createForm.time || !currentCustomer}
                >
                  {loadingCreate ? "Guardando..." : "Crear reserva ✨"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="section-card client-animated">
          <div className="panel-title-row">
            <h3 className="panel-title">🎟️ Mis reservas</h3>
            <span style={{ color: "var(--muted)", fontWeight: 800 }}>
              {filteredBookings.length} reservas
            </span>
          </div>

          <div className="client-reservation-list">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <article key={booking.id} className={`client-reservation-card client-reservation-card--tone-${index % 4}`}>
                  {editingBookingId === booking.id ? (
                    <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
                      <div className="form-grid">
                        <input
                          className="input"
                          type="date"
                          min={getTodayValue()}
                          value={editForm.date.slice(0, 10)}
                          onChange={(e) => updateEditForm("date", e.target.value)}
                          required
                        />
                        <input
                          className="input"
                          type="time"
                          value={editForm.time.slice(0, 5)}
                          onChange={(e) => updateEditForm("time", e.target.value)}
                          required
                        />
                        <select
                          className="select"
                          value={editForm.businessId}
                          onChange={(e) => updateEditForm("businessId", Number(e.target.value))}
                          required
                        >
                          {businesses.map((business) => (
                            <option key={business.id} value={business.id}>
                              {business.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className="input"
                          type="text"
                          value={editForm.serviceName}
                          onChange={(e) => updateEditForm("serviceName", e.target.value)}
                          placeholder="Servicio"
                          required
                        />
                      </div>
                      <div className="message-row">
                        <button className="secondary-btn" type="button" onClick={closeEditForm}>
                          Cancelar
                        </button>
                        <button className="primary-btn" type="submit" disabled={loadingEdit}>
                          {loadingEdit ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span className="client-reservation-card__meta">#{booking.id}</span>
                        <h4>{booking.serviceName}</h4>
                        <p>📍 {getBusinessName(booking)}</p>
                      </div>
                      <div>
                        <strong>{formatDate(booking.date)}</strong>
                        <span>🕒 {booking.time.slice(0, 5)} - {statusLabels[booking.status]}</span>
                        <span>💳 Pago: {getPaymentMethodLabel(booking)}</span>
                      </div>
                      <div className="client-reservation-actions">
                        <button type="button" className="secondary-btn" onClick={() => openEditForm(booking)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ borderColor: "rgba(255, 59, 48, 0.25)", color: "#FF3B30" }}
                          onClick={() => openDeleteModal(booking.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))
            ) : (
              <div className="empty-table-cell">
                Todavia no tienes reservas registradas.
              </div>
            )}
          </div>
        </section>

        {deleteTargetId !== null ? (
          <ModalPortal>
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-delete-modal-title"
              aria-describedby="client-delete-modal-description"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeDeleteModal();
              }}
            >
              <div className="modal-card">
                <div className="modal-icon">!</div>
                <h3 id="client-delete-modal-title" className="modal-title">
                  Eliminar reserva
                </h3>
                <p id="client-delete-modal-description" className="modal-text">
                  Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta accion no se puede deshacer.
                </p>
                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeDeleteModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={confirmDelete}
                    disabled={deletingBookingId === deleteTargetId}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {deletingBookingId === deleteTargetId ? (
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
        ) : null}

        <style jsx>{`
          .client-bookings-page {
            max-width: 1180px;
          }

          .client-hero-soft {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            padding: 48px;
            border: 1.5px solid rgba(212, 255, 0, 0.24);
            border-radius: var(--radius-lg);
            color: white;
            background:
              radial-gradient(circle at 88% 20%, rgba(212, 255, 0, 0.2), transparent 32%),
              linear-gradient(135deg, #111111 0%, #171717 54%, #0B0B0B 100%);
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
          }

          .client-hero-soft::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(212, 255, 0, 0.12), transparent 18%),
              repeating-linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.04) 0,
                rgba(255, 255, 255, 0.04) 1px,
                transparent 1px,
                transparent 22px
              );
            pointer-events: none;
          }

          .client-hero-soft > * {
            position: relative;
            z-index: 1;
          }

          .client-hero-soft h2 {
            margin: 0;
            font-size: 48px;
            letter-spacing: -0.04em;
          }

          .client-hero-soft p {
            max-width: 620px;
            margin: 10px 0 0;
            color: #A1A1A1;
            font-size: 20px;
          }

          .client-kicker {
            display: inline-flex;
            margin-bottom: 10px;
            color: var(--primary);
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .client-session-card {
            min-width: 300px;
            display: grid;
            grid-template-columns: 48px minmax(0, 1fr) 44px;
            align-items: center;
            gap: 12px;
            padding: 16px;
            border: 1.5px solid rgba(212, 255, 0, 0.26);
            border-radius: var(--radius-md);
            background:
              linear-gradient(135deg, rgba(30, 30, 30, 0.92), rgba(17, 17, 17, 0.82)),
              #111111;
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
          }

          .client-avatar {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            background: var(--primary);
            color: #111111;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 0 24px rgba(212, 255, 0, 0.28);
          }

          .client-theme-btn {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border: 1.5px solid rgba(212, 255, 0, 0.22);
            border-radius: 14px;
            background: rgba(212, 255, 0, 0.08);
            color: var(--primary);
            cursor: pointer;
            transition: all 0.2s var(--ease-out-expo);
          }

          .client-theme-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(212, 255, 0, 0.18);
          }

          .client-session-card strong,
          .client-session-card span {
            display: block;
          }

          .client-session-card span {
            margin-top: 2px;
            color: #A1A1A1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .client-logout-btn {
            grid-column: 1 / -1;
            width: 100%;
            justify-content: center;
            padding: 12px 18px;
            background: transparent;
            color: white;
            border-color: rgba(212, 255, 0, 0.22);
          }

          .client-business-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 16px;
          }

          .client-business-tile {
            min-height: 170px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 16px;
            padding: 24px;
            border: 1.5px solid rgba(212, 255, 0, 0.28);
            border-radius: var(--radius-md);
            background:
              radial-gradient(circle at 88% 12%, rgba(212, 255, 0, 0.3), transparent 28%),
              linear-gradient(135deg, rgba(212, 255, 0, 0.16), transparent 58%),
              var(--surface);
            color: var(--text);
            text-align: left;
            cursor: pointer;
            transition: all 0.25s var(--ease-out-expo);
            box-shadow: var(--shadow-sm);
            position: relative;
            overflow: hidden;
          }

          .client-business-tile::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 44%),
              repeating-linear-gradient(
                to bottom,
                rgba(212, 255, 0, 0.08) 0,
                rgba(212, 255, 0, 0.08) 1px,
                transparent 1px,
                transparent 18px
              );
            opacity: 1;
            pointer-events: none;
          }

          .client-business-tile > * {
            position: relative;
            z-index: 1;
          }

          .client-business-tile--tone-0 {
            --tile-color: var(--primary);
          }

          .client-business-tile--tone-1 {
            --tile-color: var(--primary);
          }

          .client-business-tile--tone-2 {
            --tile-color: var(--primary);
          }

          .client-business-tile--tone-3 {
            --tile-color: var(--primary);
          }

          .client-business-tile:hover,
          .client-business-tile--active {
            border-color: var(--tile-color);
            transform: translateY(-4px);
            box-shadow: 0 16px 34px rgba(212, 255, 0, 0.26);
          }

          .client-business-tile__title {
            font-size: 24px;
            font-weight: 900;
            color: var(--text);
          }

          .client-business-tile__address {
            color: var(--text);
            opacity: 0.8;
            line-height: 1.35;
          }

          .client-business-tile__hours {
            width: fit-content;
            border-radius: 999px;
            background: var(--primary);
            border: 1px solid rgba(212, 255, 0, 0.82);
            color: #111111;
            padding: 9px 14px;
            font-size: 13px;
            font-weight: 800;
            box-shadow: 0 0 18px rgba(212, 255, 0, 0.24);
          }

          .client-slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
            gap: 10px;
          }

          .client-slot {
            min-height: 48px;
            border: 1.5px solid rgba(212, 255, 0, 0.28);
            border-radius: var(--radius-sm);
            background:
              linear-gradient(135deg, rgba(212, 255, 0, 0.12), transparent 60%),
              var(--surface);
            color: var(--text);
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s var(--ease-out-expo);
          }

          .client-slot--tone-0 { --slot-color: var(--primary); }
          .client-slot--tone-1 { --slot-color: var(--primary); }
          .client-slot--tone-2 { --slot-color: var(--primary); }
          .client-slot--tone-3 { --slot-color: var(--primary); }

          .client-slot:not(:disabled):hover {
            border-color: var(--slot-color);
            background: var(--primary);
            color: #111111;
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(212, 255, 0, 0.28);
          }

          .client-slot:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            text-decoration: line-through;
          }

          .client-slot--active {
            background: var(--slot-color);
            border-color: var(--slot-color);
            color: #111111;
            box-shadow: 0 0 26px rgba(212, 255, 0, 0.34);
          }

          .client-reservation-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .client-reservation-card {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 220px auto;
            align-items: center;
            gap: 18px;
            padding: 20px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background:
              linear-gradient(90deg, rgba(212, 255, 0, 0.18), transparent 46%),
              var(--surface);
            box-shadow: var(--shadow-sm);
            border-left: 5px solid var(--reservation-color);
          }

          .client-reservation-card--tone-0 { --reservation-color: var(--primary); }
          .client-reservation-card--tone-1 { --reservation-color: var(--primary); }
          .client-reservation-card--tone-2 { --reservation-color: var(--primary); }
          .client-reservation-card--tone-3 { --reservation-color: var(--primary); }

          .client-reservation-card h4 {
            margin: 4px 0;
            font-size: 22px;
          }

          .client-reservation-card p,
          .client-reservation-card span {
            margin: 0;
            color: var(--muted);
          }

          .client-reservation-card__meta {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            color: var(--reservation-color) !important;
          }

          .client-reservation-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            flex-wrap: wrap;
          }

          [data-theme="dark"] .client-business-tile__title,
          [data-theme="dark"] .client-business-tile__hours {
            color: #FFFFFF;
          }

          [data-theme="dark"] .client-business-tile,
          [data-theme="dark"] .client-slot,
          [data-theme="dark"] .client-reservation-card {
            background:
              linear-gradient(135deg, rgba(212, 255, 0, 0.18), transparent 58%),
              #1E1E1E;
          }

          [data-theme="dark"] .client-business-tile__address,
          [data-theme="dark"] .client-reservation-card p,
          [data-theme="dark"] .client-reservation-card span {
            color: #F5F5F5;
            opacity: 0.86;
          }

          [data-theme="dark"] .client-business-tile__hours {
            color: #111111;
          }

          [data-theme="dark"] .client-session-card {
            background:
              linear-gradient(135deg, rgba(42, 42, 42, 0.9), rgba(17, 17, 17, 0.82)),
              #111111;
          }

          @media (max-width: 760px) {
            .client-hero-soft {
              flex-direction: column;
              align-items: stretch;
              padding: 24px;
            }

            .client-hero-soft h2 {
              font-size: 34px;
            }

            .client-session-card {
              min-width: 0;
            }

            .client-reservation-card {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>{isBusiness ? "Reservas del negocio" : isClient ? "Mis reservas" : "Listado de reservas"}</h2>
          <p>
            {isBusiness
              ? "Gestiona solo las reservas de tu negocio: confirma, cancela y valida pagos."
              : isClient
              ? "Consulta tus reservas y solicita una nueva cita."
              : "Gestion de reservas con cliente, negocio y pagos relacionados."}
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 3 }}>
          {isBusiness ? (
            <div className="business-session-card">
              <div className="business-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "N"}</div>
              <div>
                <strong>{user?.name ?? "Negocio"}</strong>
                <span>{user?.email}</span>
              </div>
              <button
                type="button"
                className="business-theme-btn"
                onClick={toggleTheme}
                title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              >
                {theme === "light" ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
              <button type="button" className="secondary-btn business-logout-btn" onClick={logout}>
                Cerrar sesion
              </button>
            </div>
          ) : (
            <button className="primary-btn" type="button" onClick={openCreateForm} disabled={isClient && !currentCustomer}>
              Nueva reserva
            </button>
          )}
        </div>

        <div style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          opacity: 0.15,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(10deg)"
        }}>
          <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </section>

      <section className="kpi-grid">
        <StatsCard
          title={isBusiness ? "Reservas negocio" : isClient ? "Mis reservas" : "Total reservas"}
          value={String(counts.total)}
          subtitle="Registros disponibles"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <StatsCard
          title="Pendientes"
          value={String(counts.pending)}
          subtitle="Requieren seguimiento"
          trend={{ value: "Check", positive: false }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatsCard
          title="Confirmadas"
          value={String(counts.confirmed)}
          subtitle="Estado activo"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatsCard
          title="Completadas"
          value={String(counts.paid)}
          subtitle="Reservas cerradas"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
        />
      </section>

      {!isBusiness && isCreateOpen ? (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            {renderBookingForm(createForm, updateCreateForm, true)}
            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isClient && !isBusiness && editingBookingId !== null ? (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
            <button type="button" className="secondary-btn" onClick={closeEditForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
          {renderBookingForm(editForm, updateEditForm)}
            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isClient && !isBusiness && deleteTargetId !== null && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDeleteModal();
            }}
          >
            <div className="modal-card">
              <div className="modal-icon">!</div>
              <h3 id="delete-modal-title" className="modal-title">
                Eliminar reserva
              </h3>
              <p id="delete-modal-description" className="modal-text">
                ¿Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta acción no se puede deshacer.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeDeleteModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={confirmDelete}
                  disabled={deletingBookingId === deleteTargetId}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {deletingBookingId === deleteTargetId ? (
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

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Reservas registradas</h3>
          <div className="filter-row">
            <button type="button" className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("all")}>Todas</button>
            <button type="button" className={`filter-pill ${statusFilter === "pendiente" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("pendiente")}>Pendientes</button>
            <button type="button" className={`filter-pill ${statusFilter === "confirmado" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("confirmado")}>Confirmadas</button>
            <button type="button" className={`filter-pill ${statusFilter === "completado" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("completado")}>Completadas</button>
          </div>
        </div>

        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage ? <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div> : null}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Servicio</th>
              {!isClient ? <th>Cliente</th> : null}
              <th>Metodo de pago</th>
              <th>Estado</th>
              {!isClient ? <th style={{ textAlign: "right" }}>Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td style={{ fontWeight: 700, color: "var(--muted)" }}>#{booking.id}</td>
                <td>{formatDate(booking.date)}</td>
                <td>{booking.time}</td>
                <td style={{ fontWeight: 600 }}>{booking.serviceName}</td>
                {!isClient ? <td>{getCustomerName(booking)}</td> : null}
                <td>{getPaymentMethodLabel(booking)}</td>
                <td><StatusBadge status={booking.status} /></td>
                {!isClient ? <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {isBusiness ? (
                      <>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: "8px 16px" }}
                          disabled={businessActionId === booking.id || booking.status === "confirmado" || booking.status === "completado"}
                          onClick={() => handleBusinessStatus(booking, "confirmado")}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.18)", color: "#FF3B30" }}
                          disabled={businessActionId === booking.id || booking.status === "cancelado" || booking.status === "completado"}
                          onClick={() => handleBusinessStatus(booking, "cancelado")}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="primary-btn"
                          style={{ padding: "8px 16px", fontSize: "13px" }}
                          disabled={businessActionId === booking.id || !getPendingPayment(booking)}
                          onClick={() => handleBusinessPayment(booking)}
                        >
                          Confirmar pago
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="secondary-btn" style={{ padding: "8px 16px" }} onClick={() => openEditForm(booking)}>
                          Editar
                        </button>
                        <button type="button" className="secondary-btn" style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.1)", color: "#FF3B30" }} onClick={() => openDeleteModal(booking.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td> : null}
              </tr>
            )) : (
              <tr>
                <td colSpan={isClient ? 6 : 8} style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
                  <div style={{ fontSize: "28px", marginBottom: 8, opacity: 0.4 }}>∅</div>
                  No hay reservas para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <style jsx>{`
        .business-session-card {
          min-width: 300px;
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) 44px;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1.5px solid rgba(212, 255, 0, 0.26);
          border-radius: var(--radius-md);
          background:
            linear-gradient(135deg, rgba(30, 30, 30, 0.92), rgba(17, 17, 17, 0.82)),
            #111111;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
        }

        .business-avatar {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: var(--primary);
          color: #111111;
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 0 24px rgba(212, 255, 0, 0.28);
        }

        .business-session-card strong,
        .business-session-card span {
          display: block;
        }

        .business-session-card strong {
          color: white;
        }

        .business-session-card span {
          margin-top: 2px;
          color: #A1A1A1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .business-theme-btn {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1.5px solid rgba(212, 255, 0, 0.22);
          border-radius: 14px;
          background: rgba(212, 255, 0, 0.08);
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-expo);
        }

        .business-theme-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(212, 255, 0, 0.18);
        }

        .business-logout-btn {
          grid-column: 1 / -1;
          width: 100%;
          justify-content: center;
          padding: 12px 18px;
          background: transparent;
          color: white;
          border-color: rgba(212, 255, 0, 0.22);
        }

        @media (max-width: 760px) {
          .business-session-card {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
