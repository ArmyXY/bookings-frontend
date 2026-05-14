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
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Negocios</h2>
          <p>Gestion de comercios, horarios y datos de contacto.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
          Nuevo negocio
        </button>
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
        <div className="search-row">
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio..."
          />
        </div>
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage && !isFormOpen ? <div className="message-error">{errorMessage}</div> : null}

      <section className="section-card">
        <div className="panel-title-row">
          <h3 className="panel-title">Listado de negocios</h3>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            {filteredBusinesses.length} resultados
          </span>
        </div>

        {loading ? (
          <p>Cargando negocios...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Direccion</th>
                <th>Horario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td style={{ fontWeight: 600 }}>{business.id}</td>
                    <td>{business.name}</td>
                    <td>{business.email}</td>
                    <td>{business.phone}</td>
                    <td>{business.address}</td>
                    <td>
                      {business.openingTime} - {business.closingTime}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-btn table-action-btn"
                          type="button"
                          onClick={() => openEditForm(business)}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary-btn table-action-btn"
                          type="button"
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
                  <td colSpan={7} className="empty-table-cell">
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
            <p className="modal-text">Seguro que quieres eliminar {deleteTarget.name}?</p>
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
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
