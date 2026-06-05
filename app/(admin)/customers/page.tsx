"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Customer } from "@/lib/types";
import type { CreateCustomerDto, UpdateCustomerDto } from "@/lib/api";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "@/lib/api";
import { useNotifications } from "@/components/providers/NotificationProvider";
import ModalPortal from "@/components/ui/ModalPortal";

const emptyForm: CreateCustomerDto = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CreateCustomerDto>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch {
        setErrorMessage("No se pudieron cargar los clientes. Revisa el backend.");
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = activeSearch.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone ?? ""].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [customers, activeSearch]);

  function updateForm<K extends keyof CreateCustomerDto>(
    key: K,
    value: CreateCustomerDto[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openCreateForm() {
    setErrorMessage("");
    setSuccessMessage("");
    resetForm();
    setIsFormOpen(true);
  }

  function closeForm() {
    setErrorMessage("");
    resetForm();
    setIsFormOpen(false);
  }

  function openEditForm(customer: Customer) {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      password: "",
    });
    setIsFormOpen(true);
    setTimeout(() => {
      document.getElementById('edit-customer-form')?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  const { addNotification } = useNotifications();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const payload: CreateCustomerDto = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      password: form.password?.trim() || undefined,
    };

    try {
      if (editingId === null) {
        const created = await createCustomer(payload);
        setCustomers((prev) => [created, ...prev]);
        setSuccessMessage("Cliente creado correctamente.");
        addNotification({
          title: "Cliente Registrado",
          description: `Se ha añadido a "${payload.name}" al directorio.`,
          type: "success"
        });
      } else {
        const updatePayload: UpdateCustomerDto = payload;
        const updated = await updateCustomer(editingId, updatePayload);
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === editingId ? updated : customer
          )
        );
        setSuccessMessage("Cliente actualizado correctamente.");
        addNotification({
          title: "Cliente Actualizado",
          description: `Los datos de "${payload.name}" han sido modificados.`,
          type: "success"
        });
      }

      resetForm();
      setIsFormOpen(false);
    } catch {
      setErrorMessage(
        "No se pudo guardar el cliente. Revisa los datos o si el email ya existe."
      );
      addNotification({
        title: "Error de Cliente",
        description: "Hubo un fallo al intentar guardar los datos del cliente.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteCustomer(deleteTarget.id);
      const name = deleteTarget.name;
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      setSuccessMessage("Cliente eliminado correctamente.");
      addNotification({
        title: "Cliente Eliminado",
        description: `El cliente "${name}" ha sido borrado.`,
        type: "info"
      });
    } catch {
      setErrorMessage("No se pudo eliminar el cliente.");
      addNotification({
        title: "Error al Eliminar",
        description: "No se pudo borrar el cliente del sistema.",
        type: "error"
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>Gestión de Clientes</h2>
          <p>Administra los contactos y miembros registrados.</p>
        </div>

        <div style={{ position: "relative", zIndex: 3 }}>
          <button className="primary-btn" type="button" onClick={openCreateForm}>
            Añadir cliente
          </button>
        </div>

        <div style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          opacity: 0.15,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(-5deg)"
        }}>
          <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </section>

      {isFormOpen && (
        <section id="edit-customer-form" className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">
              {editingId === null ? "Nuevo cliente" : `Editar cliente #${editingId}`}
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
                placeholder="Teléfono"
              />
              {editingId === null && (
                <input
                  className="input"
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => updateForm("password", e.target.value)}
                  placeholder="Contraseña (opcional)"
                />
              )}
            </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cliente"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="section-card">
        <form
          className="search-row"
          style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search);
          }}
        >
          <input
            className="input"
            style={{ 
              paddingRight: "100px",
              height: "56px",
              fontSize: "16px"
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nombre, email o teléfono..."
          />
          <button 
            className="primary-btn" 
            type="submit"
            style={{
              position: "absolute",
              right: "6px",
              top: "6px",
              bottom: "6px",
              padding: "0 24px",
              height: "auto",
              fontSize: "14px"
            }}
          >
            Filtrar
          </button>
        </form>
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage && !isFormOpen ? (
        <div className="message-error">{errorMessage}</div>
      ) : null}

      <section style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
        gap: "24px" 
      }}>
        {loading ? (
          <div className="surface-card" style={{ textAlign: "center", padding: "48px" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
            <p>Sincronizando directorio...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="surface-card" style={{ 
              padding: "32px", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              textAlign: "center",
              gap: "20px",
              border: "1.5px solid var(--border)",
              transition: "transform 0.3s var(--ease-out-expo)"
            }}>
              <div style={{ 
                width: "90px", 
                height: "90px", 
                borderRadius: "50%", 
                background: "var(--surface-2)",
                display: "grid",
                placeItems: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--primary)",
                border: "2.5px solid var(--border)"
              }}>
                {customer.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 800 }}>{customer.name}</h4>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 15 }}>{customer.email}</p>
                <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>
                  {customer.phone || "Sin teléfono"}
                </p>
                <div style={{ 
                  marginTop: "16px",
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: "100px",
                  background: "var(--bg)",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--muted)"
                }}>
                  ID: #{customer.id.toString().padStart(3, '0')}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, width: "100%", marginTop: "8px" }}>
                <button
                  className="secondary-btn"
                  type="button"
                  style={{ flex: 1, padding: "12px" }}
                  onClick={() => openEditForm(customer)}
                >
                  Editar
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  style={{ flex: 1, padding: "12px", borderColor: "rgba(255, 59, 48, 0.2)", color: "#FF3B30" }}
                  onClick={() => setDeleteTarget(customer)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="surface-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "64px" }}>
            <p style={{ color: "var(--muted)", fontWeight: 600 }}>No se encontraron clientes que coincidan con la búsqueda.</p>
          </div>
        )}
      </section>

      {deleteTarget && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-title"
            aria-describedby="delete-customer-description"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTarget(null);
            }}
          >
            <div className="modal-card">
              <div className="modal-icon">!</div>
              <h3 id="delete-customer-title" className="modal-title">
                Eliminar cliente
              </h3>
              <p id="delete-customer-description" className="modal-text">
                ¿Seguro que quieres eliminar a <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
              </p>
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
        </ModalPortal>
      )}
    </div>
  );
}
