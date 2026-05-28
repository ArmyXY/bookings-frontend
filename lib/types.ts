export type AppointmentStatus = "pendiente" | "confirmado" | "completado" | "cancelado";

export type PaymentStatus = "pendiente" | "pagado" | "devolucion" | "devolución" | "devoluciÃ³n";

export enum PaymentMethod {
  CASH = "efectivo",
  CARD = "tarjeta",
  TRANSFER = "transferencia",
}

export type Business = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string | null;
  openingTime: string;
  closingTime: string;
  createdAt?: string;
  appointments?: Appointment[];
  payments?: Payment[];
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  appointments?: Appointment[];
  payments?: Payment[];
  createdAt?: string;
  updatedAt?: string;
};

export type Appointment = {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
  customer?: Customer;
  business?: Business;
  payments?: Payment[];
};

export type Payment = {
  id: number;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  appointmentId: number;
  businessId?: number | null;
  customerId?: number | null;
  createdAt: string;
  appointment?: Appointment;
  business?: Business | null;
  customer?: Customer | null;
};

export type DashboardStats = {
  stats: {
    totalRevenue: number;
    totalAppointments: number;
    totalCustomers: number;
  };
  appointmentsByStatus: {
    pending: number;
    confirmed: number;
    paid: number;
  };
  recentActivity: {
    appointments: {
      id: number;
      customer: string;
      service: string;
      date: string;
      status: AppointmentStatus;
    }[];
    payments: {
      id: number;
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
      date: string;
    }[];
  };
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  isClient: boolean;
  role?: "client" | "admin" | "business";
  businessId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
