"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createBusiness,
  deleteBusiness,
  getBusinesses,
  updateBusiness,
} from "@/lib/api";
import type { CreateBusinessDto, UpdateBusinessDto } from "@/lib/api";
import type { Business } from "@/lib/types";

const emptyForm: CreateBusinessDto = {
  name: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  openingTime: "09:00",
  closingTime: "20:00",
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [form, setForm] = useState<CreateBusinessDto>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const data = await getBusinesses();
        setBusinesses(data);
      } catch {
        setErrorMessage("No se pudieron cargar los negocios.");
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return businesses;

    return businesses.filter((business) =>
      [business.name, business.email, business.phone, business.address].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [businesses, search]);

  function updateForm<K extends keyof CreateBusinessDto>(
    key: K,
    value: CreateBusinessDto[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openCreateForm() {
    setSuccessMessage("");
    setErrorMessage("");
    resetForm();
    setIsFormOpen(true);
  }

  function openEditForm(business: Business) {
    setSuccessMessage("");
    setErrorMessage("");
    setEditingId(business.id);
    setForm({
      name: business.name,
      address: business.address,
      phone: business.phone,
      email: business.email,
      description: business.description ?? "",
      openingTime: business.openingTime,
      closingTime: business.closingTime,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setErrorMessage("");
    resetForm();
    setIsFormOpen(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload: CreateBusinessDto = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      description: form.description?.trim() || undefined,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
    };

    try {
      if (editingId === null) {
        const created = await createBusiness(payload);
        setBusinesses((prev) => [created, ...prev]);
        setSuccessMessage("Negocio creado correctamente.");
      } else {
        const updated = await updateBusiness(editingId, payload as UpdateBusinessDto);
        setBusinesses((prev) =>
          prev.map((business) => (business.id === editingId ? updated : business))
        );
        setSuccessMessage("Negocio actualizado correctamente.");
      }

      closeForm();
    } catch {
      setErrorMessage("No se pudo guardar el negocio. Revisa los datos.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteBusiness(deleteTarget.id);
      setBusinesses((prev) =>
        prev.filter((business) => business.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      setSuccessMessage("Negocio eliminado correctamente.");
    } catch {
      setErrorMessage("No se pudo eliminar el negocio. Puede tener reservas relacionadas.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-stack page-transition">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Negocios</h2>
          <p>Gestión de comercios, horarios y datos de contacto.</p>
        </div>

        <div style={{ position: "relative", zIndex: 3 }}>
          <button className="primary-btn" type="button" onClick={openCreateForm}>
            Nuevo negocio
          </button>
        </div>

        <div style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          opacity: 0.15,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(8deg)"
        }}>
          <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
            <path d="M9 2h6" />
          </svg>
        </div>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-card__label">Total Negocios</p>
          <h3 className="kpi-card__value">{businesses.length}</h3>
          <p className="kpi-card__meta">Sedes registradas</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Activos hoy</p>
          <h3 className="kpi-card__value">{businesses.length}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">Operativos</p>
        </div>
        <div className="kpi-card" style={{ opacity: 0.5 }}>
          <p className="kpi-card__label">Próxima apertura</p>
          <h3 className="kpi-card__value">09:00</h3>
          <p className="kpi-card__meta">Horario estándar</p>
        </div>
        <div className="kpi-card" style={{ opacity: 0.5 }}>
          <p className="kpi-card__label">Cierre promedio</p>
          <h3 className="kpi-card__value">20:00</h3>
          <p className="kpi-card__meta">Horario estándar</p>
        </div>
      </section>

      {isFormOpen ? (
        <section className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">
              {editingId === null ? "Nuevo negocio" : `Editar negocio #${editingId}`}
            </h3>
            <button className="secondary-btn" type="button" onClick={closeForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <input
                className="input"
                type="text"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Nombre"
                required
              />
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="Email"
                required
              />
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="Telefono"
                required
              />
              <input
                className="input"
                type="text"
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                placeholder="Direccion"
                required
              />
              <input
                className="input"
                type="time"
                value={form.openingTime}
                onChange={(e) => updateForm("openingTime", e.target.value)}
                required
              />
              <input
                className="input"
                type="time"
                value={form.closingTime}
                onChange={(e) => updateForm("closingTime", e.target.value)}
                required
              />
              <textarea
                className="input input--full textarea"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Descripcion"
              />
            </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar negocio"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="section-card">
        <form
          className="search-row"
          style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}
          onSubmit={(e) => { e.preventDefault(); }}
        >
          <input
            className="input"
            style={{ height: "56px", fontSize: "16px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio por nombre, email o dirección..."
          />
        </form>
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage && !isFormOpen ? <div className="message-error">{errorMessage}</div> : null}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de negocios</h3>
          <span style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
            {filteredBusinesses.length.toString().padStart(2, '0')} NEGOCIOS REGISTRADOS
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
            <p>Sincronizando negocios...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Horario</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td style={{ fontWeight: 700, color: "var(--muted)" }}>#{business.id}</td>
                    <td style={{ fontWeight: 600 }}>{business.name}</td>
                    <td>{business.email}</td>
                    <td>{business.phone}</td>
                    <td style={{ color: "var(--muted)" }}>{business.address}</td>
                    <td>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 12px",
                        borderRadius: "100px",
                        background: "var(--surface-2)",
                        fontSize: "12px",
                        fontWeight: 700
                      }}>
                        {business.openingTime} — {business.closingTime}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          className="secondary-btn"
                          type="button"
                          style={{ padding: "8px 16px" }}
                          onClick={() => openEditForm(business)}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary-btn"
                          type="button"
                          style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.1)", color: "#FF3B30" }}
                          onClick={() => setDeleteTarget(business)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "64px", color: "var(--muted)" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>∅</div>
                    No hay negocios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {deleteTarget ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">Eliminar negocio</h3>
            <p className="modal-text">¿Seguro que quieres eliminar <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                className="danger-btn"
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {deleting ? (
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
      ) : null}
    </div>
  );
}
