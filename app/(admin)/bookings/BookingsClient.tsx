"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/api";
import {
  createAppointment,
  deleteAppointment,
  getBusinesses,
  getCustomers,
  updateAppointment,
} from "@/lib/api";
import type { Business, Customer } from "@/lib/types";

const statusLabels: Record<BookingStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  completado: "Completada",
  cancelado: "Cancelada",
};

const emptyForm: CreateBookingDto = {
  date: "",
  time: "",
  status: "pendiente",
  customerId: 0,
  businessId: 0,
  serviceName: "",
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
  }).format(new Date(date));
}

function getCustomerName(booking: Booking) {
  return booking.customer?.name ?? `Cliente #${booking.customerId}`;
}

function getBusinessName(booking: Booking) {
  return booking.business?.name ?? `Negocio #${booking.businessId}`;
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
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    async function loadRelations() {
      try {
        const [customersData, businessesData] = await Promise.all([
          getCustomers(),
          getBusinesses(),
        ]);
        setCustomers(customersData);
        setBusinesses(businessesData);
        setCreateForm((prev) => ({
          ...prev,
          customerId: customersData[0]?.id ?? 0,
          businessId: businessesData[0]?.id ?? 0,
        }));
      } catch {
        setErrorMessage("No se pudieron cargar clientes o negocios para las reservas.");
      }
    }

    loadRelations();
  }, []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const counts = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pendiente").length,
      confirmed: bookings.filter((booking) => booking.status === "confirmado").length,
      paid: bookings.filter((booking) => booking.status === "completado").length,
    }),
    [bookings]
  );

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
      customerId: customers[0]?.id ?? 0,
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

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const created = await createAppointment(createForm);
      setBookings((prev) => [created, ...prev]);
      resetCreateForm();
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa horario, cliente y negocio.");
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
        prev.map((booking) => (booking.id === editingBookingId ? updated : booking))
      );
      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function updateBookingStatus(id: number, status: BookingStatus) {
    setUpdatingStatusId(id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await updateAppointment(id, { status });
      setBookings((prev) =>
        prev.map((booking) => (booking.id === id ? { ...booking, ...updated } : booking))
      );
      setSuccessMessage("Estado actualizado correctamente.");
    } catch {
      setErrorMessage("No se pudo actualizar el estado de la reserva.");
    } finally {
      setUpdatingStatusId(null);
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
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
    } finally {
      setDeletingBookingId(null);
    }
  }

  function renderBookingForm(
    form: CreateBookingDto,
    updateForm: <K extends keyof CreateBookingDto>(key: K, value: CreateBookingDto[K]) => void
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
        <select
          className="select"
          value={form.status}
          onChange={(e) => updateForm("status", e.target.value as BookingStatus)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
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
        </select>
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
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Listado de reservas</h2>
          <p>Gestion de reservas con cliente, negocio y pagos relacionados.</p>
        </div>

        <div style={{ position: "relative", zIndex: 3 }}>
          <button className="primary-btn" type="button" onClick={openCreateForm}>
            Nueva reserva
          </button>
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
        <div className="kpi-card">
          <p className="kpi-card__label">Total reservas</p>
          <h3 className="kpi-card__value">{counts.total}</h3>
          <p className="kpi-card__meta">Registros disponibles</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Pendientes</p>
          <h3 className="kpi-card__value">{counts.pending}</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">Requieren seguimiento</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Confirmadas</p>
          <h3 className="kpi-card__value">{counts.confirmed}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">Estado activo</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Completadas</p>
          <h3 className="kpi-card__value">{counts.paid}</h3>
          <p className="kpi-card__meta">Reservas cerradas</p>
        </div>
      </section>

      {isCreateOpen ? (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            {renderBookingForm(createForm, updateCreateForm)}
            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {editingBookingId !== null ? (
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

      {deleteTargetId !== null ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar reserva</h3>
            <p className="modal-text">
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
              >
                {deletingBookingId === deleteTargetId ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage && !isCreateOpen && editingBookingId === null ? (
        <div className="message-error">{errorMessage}</div>
      ) : null}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Reservas registradas</h3>
          <div className="filter-row">
            <button type="button" className="filter-pill" onClick={() => setStatusFilter("all")}>
              Todas
            </button>
            {Object.entries(statusLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="filter-pill"
                onClick={() => setStatusFilter(value as BookingStatus)}
              >
                {label}
              </button>
            ))}
          </div>
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 600 }}>{booking.id}</td>
                  <td>{formatDate(booking.date)}</td>
                  <td>{booking.time}</td>
                  <td>{booking.serviceName}</td>
                  <td>{getCustomerName(booking)}</td>
                  <td>{getBusinessName(booking)}</td>
                  <td>
                    <StatusBadge status={booking.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      {booking.status === "pendiente" ? (
                        <button
                          type="button"
                          className="secondary-btn table-action-btn"
                          onClick={() => updateBookingStatus(booking.id, "confirmado")}
                          disabled={updatingStatusId === booking.id}
                        >
                          Confirmar
                        </button>
                      ) : null}
                      {booking.status !== "completado" ? (
                        <button
                          type="button"
                          className="secondary-btn table-action-btn"
                          onClick={() => updateBookingStatus(booking.id, "completado")}
                          disabled={updatingStatusId === booking.id}
                        >
                          Completar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="secondary-btn table-action-btn"
                        onClick={() => openEditForm(booking)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="secondary-btn table-action-btn"
                        onClick={() => openDeleteModal(booking.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  No hay reservas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
