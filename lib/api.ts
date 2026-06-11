import {
  Appointment,
  AppointmentStatus,
  Business,
  Customer,
  DashboardStats,
  Payment,
  PaymentMethod,
  PaymentStatus,
  AuthResponse,
  AuthUser,
  Reward,
  CustomerPoints,
  RedeemedReward,
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
  paymentMethod?: PaymentMethod;
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
  password?: string;
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
  services?: string[];
}

export type UpdateBusinessDto = Partial<CreateBusinessDto>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_token") ?? "";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Error en la peticion ${path}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: any): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me");
}

export function getAppointments(): Promise<Booking[]> {
  return request<Booking[]>("/appointments");
}

export interface OccupiedSlot {
  businessId: number;
  date: string;
  time: string;
}

export function getAvailability(): Promise<OccupiedSlot[]> {
  return request<OccupiedSlot[]>("/appointments/availability");
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

// --- Rewards API ---

export interface CreateRewardDto {
  name: string;
  description: string;
  costPoints: number;
}

export function createReward(data: CreateRewardDto): Promise<Reward> {
  return request<Reward>("/rewards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function addPoints(customerId: number, points: number): Promise<void> {
  return request<void>("/rewards/points", {
    method: "POST",
    body: JSON.stringify({ customerId, points }),
  });
}

export function getBusinessRewards(): Promise<Reward[]> {
  return request<Reward[]>("/rewards");
}

export function getRewardsByBusiness(businessId: number): Promise<Reward[]> {
  return request<Reward[]>(`/rewards/business/${businessId}`);
}

export function getCustomerPoints(): Promise<CustomerPoints> {
  return request<CustomerPoints>("/rewards/points");
}

export function redeemReward(rewardId: number): Promise<RedeemedReward> {
  return request<RedeemedReward>(`/rewards/${rewardId}/redeem`, {
    method: "POST",
  });
}

export function getMyRedeemedRewards(): Promise<RedeemedReward[]> {
  return request<RedeemedReward[]>("/rewards/my-rewards");
}
