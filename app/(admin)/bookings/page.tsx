import BookingsClient from "./BookingsClient";
import type { Booking } from "@/lib/api";
import { getAppointments } from "@/lib/api";

export default async function BookingsPage() {
  let bookings: Booking[] = [];
  let initialError = "";

  try {
    bookings = await getAppointments();
  } catch {
    initialError =
      "No se pudieron cargar las reservas. Comprueba que el backend esté levantado.";
  }

  return <BookingsClient initialBookings={bookings} initialError={initialError} />;
}
