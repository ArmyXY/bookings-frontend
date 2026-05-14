import {
  Appointment,
  AppointmentStatus,
  Business,
  Customer,
  DashboardStats,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "./types";

export type BookingStatus = AppointmentStatus;
export type Booking = Appointment;

export interface CreateBookingDto {
  date: string;
  time: string;
  status?: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export type UpdateBookingDto = Partial<CreateBookingDto>;

export interface CreatePaymentDto {
  amount: number;
  status?: PaymentStatus;
  method: PaymentMethod;
  appointmentId: number;
}

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export interface CreateBusinessDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  openingTime: string;
  closingTime: string;
}

export type UpdateBusinessDto = Partial<CreateBusinessDto>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Error en la peticion ${path}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export function getAppointments(): Promise<Booking[]> {
  return request<Booking[]>("/appointments");
}

export function createAppointment(data: CreateBookingDto): Promise<Booking> {
  return request<Booking>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAppointment(
  id: number,
  data: UpdateBookingDto
): Promise<Booking> {
  return request<Booking>(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAppointment(id: number): Promise<void> {
  return request<void>(`/appointments/${id}`, { method: "DELETE" });
}

export function getPayments(): Promise<Payment[]> {
  return request<Payment[]>("/payments");
}

export function createPayment(data: CreatePaymentDto): Promise<Payment> {
  return request<Payment>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePayment(id: number, data: UpdatePaymentDto): Promise<Payment> {
  return request<Payment>(`/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deletePayment(id: number): Promise<void> {
  return request<void>(`/payments/${id}`, { method: "DELETE" });
}

export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/dashboard/stats");
}

export function getCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/customers");
}

export function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  return request<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCustomer(
  id: number,
  data: UpdateCustomerDto
): Promise<Customer> {
  return request<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCustomer(id: number): Promise<void> {
  return request<void>(`/customers/${id}`, { method: "DELETE" });
}

export function getBusinesses(): Promise<Business[]> {
  return request<Business[]>("/businesses");
}

export function createBusiness(data: CreateBusinessDto): Promise<Business> {
  return request<Business>("/businesses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBusiness(
  id: number,
  data: UpdateBusinessDto
): Promise<Business> {
  return request<Business>(`/businesses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteBusiness(id: number): Promise<void> {
  return request<void>(`/businesses/${id}`, { method: "DELETE" });
}
