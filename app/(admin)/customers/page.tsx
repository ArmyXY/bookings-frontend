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

const emptyForm: CreateCustomerDto = {
  name: "",
  email: "",
  phone: "",
};

function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}) {
  const bookingsCount = customer.appointments?.length ?? 0;

  return (
    <div className="customer-card">
      <p className="customer-name">{customer.name}</p>
      <p className="customer-meta">{customer.phone || "Sin teléfono"}</p>
      <p className="customer-meta">{customer.email}</p>
      <div className="customer-tag">Cliente #{customer.id}</div>
      <div className="customer-next">
        <strong>Reservas:</strong> {bookingsCount}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button
          className="secondary-btn"
          type="button"
          onClick={() => onEdit(customer)}
        >
          Editar
        </button>
        <button
          className="secondary-btn"
          type="button"
          onClick={() => onDelete(customer)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

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
    });
    setIsFormOpen(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const payload: CreateCustomerDto = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
    };

    try {
      if (editingId === null) {
        const created = await createCustomer(payload);
        setCustomers((prev) => [created, ...prev]);
        setSuccessMessage("Cliente creado correctamente.");
      } else {
        const updatePayload: UpdateCustomerDto = payload;
        const updated = await updateCustomer(editingId, updatePayload);
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === editingId ? updated : customer
          )
        );
        setSuccessMessage("Cliente actualizado correctamente.");
      }

      resetForm();
      setIsFormOpen(false);
    } catch {
      setErrorMessage(
        "No se pudo guardar el cliente. Revisa los datos o si el email ya existe."
      );
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
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      setSuccessMessage("Cliente eliminado correctamente.");
    } catch {
      setErrorMessage("No se pudo eliminar el cliente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Directorio de clientes</h2>
          <p>Gestión visual de clientes y próximas reservas.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
          Nuevo cliente
        </button>
      </section>

      {isFormOpen && (
        <section className="section-card">
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
                className="input input--full"
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="Teléfono"
              />
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
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search);
          }}
        >
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
          />
          <button className="secondary-btn" type="submit">
            Filtrar
          </button>
        </form>
      </section>

      {successMessage ? <div className="message-success">{successMessage}</div> : null}
      {errorMessage && !isFormOpen ? (
        <div className="message-error">{errorMessage}</div>
      ) : null}

      <section className="customer-grid">
        {loading ? (
          <div className="customer-card">Cargando clientes...</div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={openEditForm}
              onDelete={setDeleteTarget}
            />
          ))
        ) : (
          <div className="customer-card">No hay clientes para mostrar.</div>
        )}
      </section>

      {deleteTarget && (
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
              ¿Seguro que quieres eliminar a {deleteTarget.name}?
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
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
