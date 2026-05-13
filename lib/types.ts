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

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  TRANSFER = "transfer",
}

export type Payment = {
  id: number;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  appointmentId: number;
  createdAt: string;
  appointment?: Appointment;
};