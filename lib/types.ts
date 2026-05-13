export type AppointmentStatus = "pending" | "confirmed" | "paid";

export type Appointment = {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  appointments?: Appointment[];
};

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentMethod = "cash" | "card" | "transfer";

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
