"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/api";
import {
  createAppointment,
  createCustomer,
  deleteAppointment,
  getAppointments,
  getBusinesses,
  getCustomers,
  updateAppointment,
  updateBusiness,
  updatePayment,
  getAvailability,
  type OccupiedSlot,
} from "@/lib/api";
import { PaymentMethod, type Business, type Customer } from "@/lib/types";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import StatsCard from "@/components/ui/StatsCard";
import ModalPortal from "@/components/ui/ModalPortal";
import { useTableSort } from "@/hooks/useTableSort";

const statusLabels: Record<BookingStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmada",
  completado: "Completada",
  cancelado: "Cancelada",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CARD]: "Tarjeta",
  [PaymentMethod.TRANSFER]: "Transferencia",
};

const statusColors: Record<BookingStatus, string> = {
  pendiente: "#F59E0B",
  confirmado: "#10B981",
  completado: "#3B82F6",
  cancelado: "#EF4444",
};

const emptyForm: CreateBookingDto = {
  date: "",
  time: "",
  status: "pendiente",
  customerId: 0,
  businessId: 0,
  serviceName: "",
  paymentMethod: PaymentMethod.CASH,
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const badgeStatus =
    status === "completado"
      ? "completed"
      : status === "confirmado"
        ? "confirmed"
        : status === "cancelado"
          ? "paid"
          : "pending";

  return <span className={`badge badge--${badgeStatus}`}>{statusLabels[status]}</span>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function formatMonthLabel(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatShortDay(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function getMonthCalendarCells(anchorDate: string) {
  const anchor = new Date(`${anchorDate}T00:00:00`);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: mondayOffset }, () => null);

  Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  });

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function moveMonth(date: string, amount: number) {
  const current = new Date(`${date}T00:00:00`);
  const year = current.getFullYear();
  const month = current.getMonth() + amount;
  const selectedDay = current.getDate();
  const targetLastDay = new Date(year, month + 1, 0).getDate();
  const target = new Date(year, month, Math.min(selectedDay, targetLastDay));

  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

function buildHourlySlots(business: Business) {
  const [openHour, openMinute] = business.openingTime.split(":").map(Number);
  const [closeHour, closeMinute] = business.closingTime.split(":").map(Number);
  const open = openHour * 60 + openMinute;
  const close = closeHour * 60 + closeMinute;
  const slots: string[] = [];

  for (let minute = open; minute < close; minute += 60) {
    const hour = Math.floor(minute / 60);
    const minutes = minute % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  }

  return slots.length ? slots : [business.openingTime.slice(0, 5)];
}

function getCustomerName(booking: Booking) {
  return booking.customer?.name ?? `Cliente #${booking.customerId}`;
}

function getBusinessName(booking: Booking) {
  return booking.business?.name ?? `Negocio #${booking.businessId}`;
}

function getPaymentMethodLabel(booking: Booking) {
  const method = booking.payments?.[0]?.method;
  return method ? paymentMethodLabels[method] : "Pendiente";
}

function getPendingPayment(booking: Booking) {
  return booking.payments?.find((payment) => payment.status !== "pagado") ?? null;
}

export default function BookingsClient({
  initialBookings,
  initialError = "",
}: {
  initialBookings: Booking[];
  initialError?: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [businessActionId, setBusinessActionId] = useState<number | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [businessSelectedDate, setBusinessSelectedDate] = useState(getTodayValue());
  const [businessScheduleForm, setBusinessScheduleForm] = useState({
    openingTime: "09:00",
    closingTime: "20:00",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [businessRatings, setBusinessRatings] = useState<Record<number, number>>({});
  const [businessSearch, setBusinessSearch] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const clientPageRef = useRef<HTMLDivElement>(null);
  const clientBookingPanelRef = useRef<HTMLElement>(null);
  const clientReservationsRef = useRef<HTMLElement>(null);
  const businessPageRef = useRef<HTMLDivElement>(null);
  const knownBusinessBookingIdsRef = useRef<Set<number>>(new Set());
  const knownCustomerIdsRef = useRef<Set<number>>(new Set());
  const createFormSectionRef = useRef<HTMLElement>(null);
  const shouldScrollClientBookingPanelRef = useRef(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isClient = user?.role === "client";
  const isBusiness = user?.role === "business";
  const { addNotification } = useNotifications();

  useEffect(() => {
    async function loadRelations() {
      if (!user) return;

      try {
        const [loadedBookings, loadedCustomers, businessesData, availabilityData] = await Promise.all([
          getAppointments(),
          isClient ? Promise.resolve([]) : getCustomers(),
          getBusinesses(),
          isClient ? getAvailability() : Promise.resolve([]),
        ]);
        let customersData = loadedCustomers;
        let defaultCustomerId = 0;

        if (isClient && user) {
          const clientCustomer: Customer = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: (user as any).phone || null,
          };
          customersData = [clientCustomer];
          defaultCustomerId = clientCustomer.id;
          setCurrentCustomer(clientCustomer);
        } else {
          defaultCustomerId = customersData[0]?.id ?? 0;
        }

        const defaultBusinessId = isBusiness && user.businessId
          ? user.businessId
          : businessesData[0]?.id ?? 0;
        const userBusiness = businessesData.find((business) => business.id === defaultBusinessId);

        setBookings(loadedBookings);
        if (isClient) {
          setOccupiedSlots(availabilityData);
        }
        setCustomers(customersData);
        knownCustomerIdsRef.current = new Set(customersData.map((c) => c.id));
        setBusinesses(businessesData);
        setSelectedBusinessId(defaultBusinessId || null);
        if (userBusiness) {
          setBusinessScheduleForm({
            openingTime: userBusiness.openingTime.slice(0, 5),
            closingTime: userBusiness.closingTime.slice(0, 5),
          });
        }
        if (isBusiness && user.businessId) {
          knownBusinessBookingIdsRef.current = new Set(
            loadedBookings
              .filter((booking) => booking.businessId === user.businessId)
              .map((booking) => booking.id)
          );
        }
        setCreateForm((prev) => ({
          ...prev,
          customerId: defaultCustomerId,
          businessId: defaultBusinessId,
          date: prev.date || getTodayValue(),
        }));
      } catch {
        setErrorMessage("No se pudieron cargar las reservas. Revisa la sesion y el backend.");
      }
    }

    loadRelations();
  }, [isBusiness, isClient, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const loadedBookings = await getAppointments();
        setBookings(loadedBookings);
        if (isClient) {
          const availability = await getAvailability();
          setOccupiedSlots(availability);
        }
      } catch (err) {
        console.error("Error polling appointments/availability:", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [user, isClient]);

  useEffect(() => {
    if (!isClient || !clientPageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".client-animated",
        { opacity: 0, y: 18, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.08,
        }
      );
    }, clientPageRef);

    return () => ctx.revert();
  }, [isClient, businesses.length]);

  useEffect(() => {
    if (!isClient || !isCreateOpen || !clientBookingPanelRef.current) return;

    const timeout = shouldScrollClientBookingPanelRef.current
      ? setTimeout(() => {
          shouldScrollClientBookingPanelRef.current = false;
          clientBookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150)
      : null;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        clientBookingPanelRef.current,
        { opacity: 0, y: 22, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
      );
    });

    return () => {
      if (timeout) clearTimeout(timeout);
      ctx.revert();
    };
  }, [isClient, isCreateOpen, selectedBusinessId]);

  useEffect(() => {
    if (!isBusiness || !businessPageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".business-animated",
        { opacity: 0, y: 18, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.06,
        }
      );
    }, businessPageRef);

    return () => ctx.revert();
  }, [isBusiness, businesses.length]);

  useEffect(() => {
    if (isClient || !isCreateOpen || !createFormSectionRef.current) return;
    const timeout = setTimeout(() => {
      createFormSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timeout);
  }, [isClient, isCreateOpen]);

  useEffect(() => {
    if (!isBusiness || !user?.businessId) return;

    const interval = setInterval(async () => {
      try {
        const latestBookings = await getAppointments();
        const businessBookings = latestBookings.filter(
          (booking) => booking.businessId === user.businessId
        );
        const knownIds = knownBusinessBookingIdsRef.current;
        const newBookings = businessBookings.filter((booking) => !knownIds.has(booking.id));

        if (knownIds.size > 0 && newBookings.length > 0) {
          addNotification({
            title: newBookings.length === 1 ? "Nueva reserva" : "Nuevas reservas",
            description:
              newBookings.length === 1
                ? `${getCustomerName(newBookings[0])} ha reservado ${newBookings[0].serviceName}.`
                : `Han entrado ${newBookings.length} reservas nuevas.`,
            type: "info",
          });
        }

        knownBusinessBookingIdsRef.current = new Set(
          businessBookings.map((booking) => booking.id)
        );
        setBookings(latestBookings);
      } catch {
        setErrorMessage("No se pudieron sincronizar las reservas nuevas.");
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [addNotification, isBusiness, user?.businessId]);

  useEffect(() => {
    if (isClient) return;

    const interval = setInterval(async () => {
      try {
        const latestCustomers = await getCustomers();
        const knownIds = knownCustomerIdsRef.current;
        const newCustomers = latestCustomers.filter((c) => !knownIds.has(c.id));

        if (knownIds.size > 0 && newCustomers.length > 0) {
          addNotification({
            title: newCustomers.length === 1 ? "Nuevo cliente registrado" : "Nuevos clientes",
            description:
              newCustomers.length === 1
                ? `${newCustomers[0].name} se ha registrado en el sistema.`
                : `Se han registrado ${newCustomers.length} nuevos clientes.`,
            type: "info",
          });
        }

        knownCustomerIdsRef.current = new Set(latestCustomers.map((c) => c.id));
        setCustomers(latestCustomers);
      } catch {
        // silently fail
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [addNotification, isClient]);

  const filteredBookings = useMemo(() => {
    if (isClient && !currentCustomer) return [];
    if (isBusiness && !user?.businessId) return [];
    const roleBookings =
      isClient && currentCustomer
        ? bookings.filter((booking) => booking.customerId === currentCustomer.id)
        : isBusiness
        ? bookings.filter((booking) => booking.businessId === user?.businessId)
        : bookings;
    if (statusFilter === "all") return roleBookings;
    return roleBookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, currentCustomer, isBusiness, isClient, statusFilter, user?.businessId]);

  const visibleBookings = useMemo(
    () =>
      isClient && !currentCustomer
        ? []
        : isBusiness && !user?.businessId
        ? []
        : isClient && currentCustomer
        ? bookings.filter((booking) => booking.customerId === currentCustomer.id)
        : isBusiness
        ? bookings.filter((booking) => booking.businessId === user?.businessId)
        : bookings,
    [bookings, currentCustomer, isBusiness, isClient, user?.businessId]
  );

  const counts = useMemo(
    () => ({
      total: visibleBookings.length,
      pending: visibleBookings.filter((booking) => booking.status === "pendiente").length,
      confirmed: visibleBookings.filter((booking) => booking.status === "confirmado").length,
      paid: visibleBookings.filter((booking) => booking.status === "completado").length,
    }),
    [visibleBookings]
  );

  const currentBusiness = useMemo(
    () => businesses.find((business) => business.id === user?.businessId) ?? null,
    [businesses, user?.businessId]
  );

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId]
  );

  const filteredBusinessesForClient = useMemo(() => {
    const term = businessSearch.trim().toLowerCase();
    if (!term) return businesses;

    return businesses.filter((business) =>
      business.name.toLowerCase().includes(term)
    );
  }, [businessSearch, businesses]);

  const selectedDayBookings = useMemo(() => {
    if (!selectedBusiness || !createForm.date) return [];
    return bookings.filter(
      (booking) =>
        booking.businessId === selectedBusiness.id &&
        booking.date.startsWith(createForm.date) &&
        booking.status !== "cancelado"
    );
  }, [bookings, createForm.date, selectedBusiness]);

  const availableSlots = useMemo(() => {
    if (!selectedBusiness) return [];
    const bookedTimes = new Set(
      selectedDayBookings.map((booking) => booking.time.slice(0, 5))
    );

    if (isClient) {
      occupiedSlots.forEach((slot) => {
        if (
          slot.businessId === selectedBusiness.id &&
          slot.date.startsWith(createForm.date)
        ) {
          bookedTimes.add(slot.time.slice(0, 5));
        }
      });
    }

    return buildHourlySlots(selectedBusiness).map((slot) => ({
      value: slot,
      isBooked: bookedTimes.has(slot),
    }));
  }, [selectedBusiness, selectedDayBookings, occupiedSlots, isClient, createForm.date]);

  const businessTodayBookings = useMemo(
    () =>
      visibleBookings.filter(
        (booking) =>
          booking.date.startsWith(getTodayValue()) &&
          (booking.status === "pendiente" || booking.status === "confirmado")
      ),
    [visibleBookings]
  );

  const businessSelectedDateBookings = useMemo(
    () =>
      visibleBookings.filter((booking) =>
        booking.date.startsWith(businessSelectedDate)
      ),
    [businessSelectedDate, visibleBookings]
  );

  const businessDisplayBookings = useMemo(() => {
    let list = filteredBookings;
    if (isBusiness) {
      list = statusFilter === "all" ? businessSelectedDateBookings : businessSelectedDateBookings.filter((booking) => booking.status === statusFilter);
    }
    return list.map((booking) => ({
      ...booking,
      customerName: getCustomerName(booking),
      paymentMethodName: getPaymentMethodLabel(booking),
    }));
  }, [businessSelectedDateBookings, filteredBookings, isBusiness, statusFilter]);

  const { requestSort: requestBookingSort, sortedData: sortedBookings, renderSortIcon: renderBookingSortIcon } = useTableSort(businessDisplayBookings, 'date', 'desc');

  const businessSlots = useMemo(() => {
    if (!currentBusiness) return [];
    const bookedTimes = new Set(
      businessSelectedDateBookings
        .filter((booking) => booking.status !== "cancelado")
        .map((booking) => booking.time.slice(0, 5))
    );

    return buildHourlySlots(currentBusiness).map((slot) => ({
      value: slot,
      isBooked: bookedTimes.has(slot),
      booking: businessSelectedDateBookings.find(
        (booking) => booking.time.slice(0, 5) === slot && booking.status !== "cancelado"
      ),
    }));
  }, [businessSelectedDateBookings, currentBusiness]);

  const businessMonthDays = useMemo(
    () => getMonthCalendarCells(businessSelectedDate),
    [businessSelectedDate]
  );

  const businessStatusChart = useMemo(
    () =>
      (Object.keys(statusLabels) as BookingStatus[]).map((status) => ({
        name: statusLabels[status],
        value: visibleBookings.filter((booking) => booking.status === status).length,
        color: statusColors[status],
      })),
    [visibleBookings]
  );

  const businessActivityData = useMemo(() => {
    return [...Array(7)].map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return {
        date: formatShortDay(value),
        reservas: visibleBookings.filter((booking) => booking.date.startsWith(value)).length,
      };
    });
  }, [visibleBookings]);

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetCreateForm() {
    setCreateForm({
      ...emptyForm,
      customerId: currentCustomer?.id ?? customers[0]?.id ?? 0,
      businessId: isBusiness ? user?.businessId ?? 0 : businesses[0]?.id ?? 0,
      date: getTodayValue(),
    });
  }

  function resetEditForm() {
    setEditForm(emptyForm);
  }

  function openCreateForm() {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    if (isClient) {
      shouldScrollClientBookingPanelRef.current = true;
    }
    setCreateForm((prev) => ({
      ...prev,
      date: prev.date || getTodayValue(),
      businessId: isBusiness ? user?.businessId ?? prev.businessId : prev.businessId,
      customerId: prev.customerId || customers[0]?.id || 0,
      status: isBusiness ? "confirmado" : prev.status,
    }));
    setIsCreateOpen(true);
    if (isClient) {
      setTimeout(() => {
        if (shouldScrollClientBookingPanelRef.current && clientBookingPanelRef.current) {
          shouldScrollClientBookingPanelRef.current = false;
          clientBookingPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  function selectBusiness(business: Business) {
    if (isClient) {
      shouldScrollClientBookingPanelRef.current = true;
    }
    setSelectedBusinessId(business.id);
    setSuccessMessage("");
    setErrorMessage("");
    setIsCreateOpen(true);
    setCreateForm((prev) => ({
      ...prev,
      businessId: business.id,
      customerId: currentCustomer?.id ?? prev.customerId,
      date: prev.date || getTodayValue(),
      time: "",
    }));
    if (isClient) {
      setTimeout(() => {
        if (shouldScrollClientBookingPanelRef.current && clientBookingPanelRef.current) {
          shouldScrollClientBookingPanelRef.current = false;
          clientBookingPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }

  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: booking.serviceName,
    });
    if (!isClient && !isBusiness) {
      setTimeout(() => {
        document.getElementById('edit-booking-form')?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() {
    setDeleteTargetId(null);
  }

  function selectBusinessCalendarDate(date: string) {
    setBusinessSelectedDate(date);
    setCreateForm((prev) => ({ ...prev, date, time: "" }));
  }

  function changeBusinessMonth(amount: number) {
    const nextDate = moveMonth(businessSelectedDate, amount);
    selectBusinessCalendarDate(nextDate);
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = {
        ...createForm,
        status: isClient ? "pendiente" as BookingStatus : createForm.status,
        customerId: currentCustomer?.id ?? createForm.customerId,
        businessId: isBusiness ? user?.businessId ?? createForm.businessId : createForm.businessId,
      };

      if (isClient) {
        const isOccupied = occupiedSlots.some(
          (slot) =>
            slot.businessId === payload.businessId &&
            slot.date.startsWith(payload.date) &&
            slot.time.slice(0, 5) === payload.time.slice(0, 5)
        );
        if (isOccupied) {
          setAlertMessage("Lo siento, se te han adelantado.");
          setLoadingCreate(false);
          return;
        }
      }

      const created = await createAppointment(payload);
      const enrichedCreated = {
        ...created,
        customer: currentCustomer ?? created.customer,
        business: businesses.find((business) => business.id === created.businessId) ?? created.business,
      };
      setBookings((prev) => [enrichedCreated, ...prev]);
      resetCreateForm();
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
      addNotification({
        title: "Reserva Creada",
        description: `Nueva reserva para "${created.serviceName}" registrada con éxito.`,
        type: "success"
      });
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (errMsg.includes("Esta hora ya está reservada") || errMsg.includes("ya está reservada")) {
        setAlertMessage("Lo siento, se te han adelantado.");
      } else {
        setErrorMessage("No se pudo crear la reserva. Revisa horario, cliente y negocio.");
      }
      addNotification({
        title: "Error en Reserva",
        description: "No se pudo registrar la nueva reserva.",
        type: "error"
      });
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBookingId) return;

    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        customerId: editForm.customerId,
        businessId: editForm.businessId,
        serviceName: editForm.serviceName,
      };
      const updated = await updateAppointment(editingBookingId, payload);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBookingId
            ? {
                ...booking,
                ...updated,
                customer: booking.customer,
                business:
                  businesses.find((business) => business.id === updated.businessId) ??
                  booking.business,
              }
            : booking
        )
      );
      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
      addNotification({
        title: "Reserva Modificada",
        description: `La reserva #${editingBookingId} ha sido actualizada.`,
        type: "success"
      });
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
      addNotification({
        title: "Error al Editar",
        description: "Hubo un problema al guardar los cambios de la reserva.",
        type: "error"
      });
    } finally {
      setLoadingEdit(false);
    }
  }

  async function handleBusinessStatus(booking: Booking, status: Extract<BookingStatus, "confirmado" | "cancelado">) {
    if (!isBusiness || booking.businessId !== user?.businessId) return;

    setBusinessActionId(booking.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updated = await updateAppointment(booking.id, { status });
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                ...updated,
                customer: item.customer,
                business: item.business,
                payments: item.payments,
              }
            : item
        )
      );
      setSuccessMessage(`Reserva ${status === "confirmado" ? "confirmada" : "cancelada"} correctamente.`);
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setBusinessActionId(null);
    }
  }

  async function handleBusinessPayment(booking: Booking) {
    if (!isBusiness || booking.businessId !== user?.businessId) return;
    const payment = getPendingPayment(booking);
    if (!payment) return;

    setBusinessActionId(booking.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updatedPayment = await updatePayment(payment.id, { status: "pagado" });
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                status: "completado",
                payments: item.payments?.map((existingPayment) =>
                  existingPayment.id === updatedPayment.id ? updatedPayment : existingPayment
                ),
              }
            : item
        )
      );
      setSuccessMessage("Pago confirmado correctamente.");
    } catch {
      setErrorMessage("No se pudo confirmar el pago.");
    } finally {
      setBusinessActionId(null);
    }
  }

  async function handleBusinessScheduleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentBusiness) return;

    if (businessScheduleForm.openingTime >= businessScheduleForm.closingTime) {
      setErrorMessage("La apertura debe ser anterior al cierre.");
      return;
    }

    setSavingSchedule(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updated = await updateBusiness(currentBusiness.id, {
        openingTime: businessScheduleForm.openingTime,
        closingTime: businessScheduleForm.closingTime,
      });
      setBusinesses((prev) =>
        prev.map((business) => (business.id === updated.id ? updated : business))
      );
      setSuccessMessage("Horario actualizado correctamente.");
      addNotification({
        title: "Horario actualizado",
        description: `${updated.name} abre de ${updated.openingTime} a ${updated.closingTime}.`,
        type: "success",
      });
    } catch {
      setErrorMessage("No se pudo actualizar el horario del negocio.");
      addNotification({
        title: "Error de horario",
        description: "No se pudieron guardar los nuevos horarios.",
        type: "error",
      });
    } finally {
      setSavingSchedule(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));
      if (editingBookingId === deleteTargetId) closeEditForm();
      setSuccessMessage("Reserva eliminada correctamente.");
      addNotification({
        title: "Reserva Eliminada",
        description: `La reserva #${deleteTargetId} ha sido eliminada.`,
        type: "info"
      });
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
      addNotification({
        title: "Error al Eliminar",
        description: "No se pudo borrar la reserva seleccionada.",
        type: "error"
      });
    } finally {
      setDeletingBookingId(null);
    }
  }

  function renderBookingForm(
    form: CreateBookingDto,
    updateForm: <K extends keyof CreateBookingDto>(key: K, value: CreateBookingDto[K]) => void,
    includePaymentMethod = false
  ) {
    return (
      <div className="form-grid">
        <input
          className="input"
          type="date"
          value={form.date}
          onChange={(e) => updateForm("date", e.target.value)}
          required
        />
        <input
          className="input"
          type="time"
          value={form.time}
          onChange={(e) => updateForm("time", e.target.value)}
          required
        />
        {!isClient ? <select
          className="select"
          value={form.status}
          onChange={(e) => updateForm("status", e.target.value as BookingStatus)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select> : null}
        {!isClient ? <select
          className="select"
          value={form.customerId}
          onChange={(e) => updateForm("customerId", Number(e.target.value))}
          required
        >
          <option value={0}>Selecciona cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select> : null}
        {!isBusiness ? <select
          className="select"
          value={form.businessId}
          onChange={(e) => updateForm("businessId", Number(e.target.value))}
          required
        >
          <option value={0}>Selecciona negocio</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name} ({business.openingTime}-{business.closingTime})
            </option>
          ))}
        </select> : (
          <input
            className="input"
            type="text"
            value={currentBusiness ? `${currentBusiness.name} (${currentBusiness.openingTime}-${currentBusiness.closingTime})` : "Negocio"}
            readOnly
          />
        )}
        {(() => {
          const selectedBusinessForForm = businesses.find(b => b.id === form.businessId);
          const businessServices = selectedBusinessForForm?.services ?? [];
          return businessServices.length > 0 ? (
            <select
              className="select input--full"
              value={form.serviceName}
              onChange={(e) => updateForm("serviceName", e.target.value)}
              required
            >
              <option value="">Selecciona servicio</option>
              {businessServices.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input input--full"
              type="text"
              value={form.serviceName}
              onChange={(e) => updateForm("serviceName", e.target.value)}
              placeholder="Servicio"
              required
            />
          );
        })()}
        {includePaymentMethod ? (
          <select
            className="select input--full"
            value={form.paymentMethod ?? PaymentMethod.CASH}
            onChange={(e) => updateForm("paymentMethod", e.target.value as PaymentMethod)}
            required
          >
            <option value={PaymentMethod.CASH}>Metodo de pago: Efectivo</option>
            <option value={PaymentMethod.CARD}>Metodo de pago: Tarjeta</option>
            <option value={PaymentMethod.TRANSFER}>Metodo de pago: Transferencia</option>
          </select>
        ) : null}
      </div>
    );
  }

  if (isClient) {
    return (
      <div ref={clientPageRef} className="page-stack page-transition client-bookings-page">
        <section className="client-hero-soft client-animated">
          <div>
            <span className="client-kicker">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Area de cliente
            </span>
            <h2>
              Reservar cita
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle', color: 'var(--primary)' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </h2>
            <p>Elige un negocio, selecciona fecha y hora, y consulta tus reservas desde esta misma pantalla.</p>
          </div>

          <div className="client-hero-actions">
            <button
              className="Nuevo-btn"
              type="button"
              onClick={() => clientReservationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Mis reservas
            </button>
          </div>
          <div className="client-session-card" style={{ display: "none" }} aria-hidden="true">
            <div className="client-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "C"}</div>
            <div>
              <strong>{user?.name ?? "Cliente"}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="client-theme-btn"
              onClick={toggleTheme}
              title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              {theme === "light" ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <button type="button" className="secondary-btn client-logout-btn" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </section>

        {successMessage ? <div className="message-success">{successMessage}</div> : null}
        {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

        <section className="section-card client-animated">
          <div className="panel-title-row">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px', color: 'var(--primary)' }}><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><path d="M10 22V18H14V22"/><path d="M6 6H18"/><path d="M6 10H18"/><path d="M6 14H18"/></svg>
              Negocios disponibles
            </h3>
            <span style={{ color: "var(--muted)", fontWeight: 800 }}>
              {filteredBusinessesForClient.length} disponibles
            </span>
          </div>

          <form
            className="client-business-search"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              className="input"
              value={businessSearch}
              onChange={(e) => setBusinessSearch(e.target.value)}
              placeholder="Buscar negocio por nombre..."
            />
          </form>

          <div className="client-business-grid">
            {filteredBusinessesForClient.length > 0 ? filteredBusinessesForClient.map((business, index) => (
              <article
                key={business.id}
                role="button"
                tabIndex={0}
                className={`client-business-tile client-business-tile--tone-${index % 4} client-animated ${selectedBusinessId === business.id ? "client-business-tile--active" : ""}`}
                onClick={() => selectBusiness(business)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectBusiness(business);
                  }
                }}
              >
                <span className="client-business-tile__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  {business.name}
                </span>
                <span className="client-business-tile__address">{business.address}</span>
                <div className="client-business-tile__rating" onClick={(e) => e.stopPropagation()}>
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`client-star-btn ${(businessRatings[business.id] ?? 0) >= star ? 'client-star-btn--active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setBusinessRatings(prev => ({ ...prev, [business.id]: prev[business.id] === star ? 0 : star })); }}
                      aria-label={`Valorar con ${star} estrellas`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={(businessRatings[business.id] ?? 0) >= star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  ))}
                  <span className="client-star-label">
                    {businessRatings[business.id] ? `${businessRatings[business.id]}/5` : 'Sin valorar'}
                  </span>
                </div>
                <span className="client-business-tile__hours" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {business.openingTime} - {business.closingTime}
                </span>
              </article>
            )) : (
              <div className="empty-table-cell" style={{ gridColumn: "1 / -1" }}>
                No hay negocios con ese nombre.
              </div>
            )}
          </div>
        </section>

        {selectedBusiness && isCreateOpen ? (
          <section ref={clientBookingPanelRef} className="section-card client-booking-panel">
            <div className="panel-title-row">
              <div>
                <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px', color: 'var(--primary)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Calendario de {selectedBusiness.name}
                </h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                  Selecciona fecha, hora y servicio para solicitar tu reserva.
                </p>
              </div>
              <button type="button" className="secondary-btn" onClick={closeCreateForm}>
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 20 }}>
              <div className="form-grid">
                <input
                  className="input"
                  type="date"
                  min={getTodayValue()}
                  value={createForm.date}
                  onChange={(e) => updateCreateForm("date", e.target.value)}
                  required
                />
                {selectedBusiness?.services && selectedBusiness.services.length > 0 ? (
                  <select
                    className="select"
                    value={createForm.serviceName}
                    onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                    required
                  >
                    <option value="">Selecciona servicio</option>
                    {selectedBusiness.services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    type="text"
                    value={createForm.serviceName}
                    onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                    placeholder="Servicio"
                    required
                  />
                )}
                <select
                  className="select"
                  value={createForm.paymentMethod ?? PaymentMethod.CASH}
                  onChange={(e) => updateCreateForm("paymentMethod", e.target.value as PaymentMethod)}
                  required
                >
                  <option value={PaymentMethod.CASH}>Pago en efectivo</option>
                  <option value={PaymentMethod.CARD}>Pago con tarjeta</option>
                  <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                </select>
              </div>

              <div className="client-slots-grid">
                {availableSlots.map((slot, index) => {
                  const isAvailable = !slot.isBooked;

                  return (
                    <button
                      key={slot.value}
                      type="button"
                      className={`client-slot client-slot--tone-${index % 4} ${createForm.time === slot.value ? "client-slot--active" : ""} ${slot.isBooked ? "client-slot--booked" : ""}`}
                      title={isAvailable ? "Horario disponible" : "Horario no disponible"}
                      aria-label={`${slot.value} - ${isAvailable ? "disponible" : "no disponible"}`}
                      onClick={() => {
                        if (slot.isBooked) {
                          setAlertMessage("Lo siento, se te han adelantado.");
                        } else {
                          updateCreateForm("time", slot.value);
                        }
                      }}
                      style={{
                        opacity: slot.isBooked ? 0.6 : 1,
                        cursor: "pointer",
                      }}
                    >
                      <span className="client-slot__icon" aria-hidden="true">
                        {isAvailable ? "🔓" : "🔒"}
                      </span>
                      <span>{slot.value}</span>
                    </button>
                  );
                })}
              </div>

              <div className="message-row">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={loadingCreate || !createForm.time || !currentCustomer}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  {loadingCreate ? (
                    "Guardando..."
                  ) : (
                    <>
                      Crear reserva
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section ref={clientReservationsRef} className="section-card client-animated">
          <div className="panel-title-row">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px', color: 'var(--primary)' }}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><path d="M12 5v14"/></svg>
              Mis reservas
            </h3>
            <span style={{ color: "var(--muted)", fontWeight: 800 }}>
              {filteredBookings.length} reservas
            </span>
          </div>

          <div className="client-reservation-list">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <article key={booking.id} className={`client-reservation-card client-reservation-card--tone-${index % 4}`}>
                  {editingBookingId === booking.id ? (
                    <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
                      <div className="form-grid">
                        <input
                          className="input"
                          type="date"
                          min={getTodayValue()}
                          value={editForm.date.slice(0, 10)}
                          onChange={(e) => updateEditForm("date", e.target.value)}
                          required
                        />
                        <input
                          className="input"
                          type="time"
                          value={editForm.time.slice(0, 5)}
                          onChange={(e) => updateEditForm("time", e.target.value)}
                          required
                        />
                        <select
                          className="select"
                          value={editForm.businessId}
                          onChange={(e) => updateEditForm("businessId", Number(e.target.value))}
                          required
                        >
                          {businesses.map((business) => (
                            <option key={business.id} value={business.id}>
                              {business.name}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const editBusiness = businesses.find(b => b.id === editForm.businessId);
                          const editServices = editBusiness?.services ?? [];
                          return editServices.length > 0 ? (
                            <select
                              className="select"
                              value={editForm.serviceName}
                              onChange={(e) => updateEditForm("serviceName", e.target.value)}
                              required
                            >
                              <option value="">Selecciona servicio</option>
                              {editServices.map((service) => (
                                <option key={service} value={service}>
                                  {service}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="input"
                              type="text"
                              value={editForm.serviceName}
                              onChange={(e) => updateEditForm("serviceName", e.target.value)}
                              placeholder="Servicio"
                              required
                        />
                          );
                        })()}
                      </div>
                      <div className="message-row">
                        <button className="secondary-btn" type="button" onClick={closeEditForm}>
                          Cancelar
                        </button>
                        <button className="primary-btn" type="submit" disabled={loadingEdit}>
                          {loadingEdit ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span className="client-reservation-card__meta">#{booking.id}</span>
                        <h4>{booking.serviceName}</h4>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {getBusinessName(booking)}
                        </p>
                      </div>
                      <div>
                        <strong>{formatDate(booking.date)}</strong>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {booking.time.slice(0, 5)} - {statusLabels[booking.status]}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--muted)' }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          Pago: {getPaymentMethodLabel(booking)}
                        </span>
                      </div>
                      <div className="client-reservation-actions">
                        <button type="button" className="secondary-btn" onClick={() => openEditForm(booking)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ borderColor: "rgba(255, 59, 48, 0.25)", color: "#FF3B30" }}
                          onClick={() => openDeleteModal(booking.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))
            ) : (
              <div className="empty-table-cell">
                Todavia no tienes reservas registradas.
              </div>
            )}
          </div>
        </section>

        {deleteTargetId !== null ? (
          <ModalPortal>
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-delete-modal-title"
              aria-describedby="client-delete-modal-description"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeDeleteModal();
              }}
            >
              <div className="modal-card">
                <div className="modal-icon">!</div>
                <h3 id="client-delete-modal-title" className="modal-title">
                  Eliminar reserva
                </h3>
                <p id="client-delete-modal-description" className="modal-text">
                  Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta accion no se puede deshacer.
                </p>
                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={closeDeleteModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={confirmDelete}
                    disabled={deletingBookingId === deleteTargetId}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {deletingBookingId === deleteTargetId ? (
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
        ) : null}

        <style jsx>{`
          .client-bookings-page {
            max-width: 1180px;
            margin: 0 auto;
            font-family: 'Roboto Condensed', sans-serif;
          }

          .client-hero-soft {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            padding: 48px;
            border: 1.5px solid rgba(212, 255, 0, 0.18);
            border-radius: var(--radius-lg);
            color: white;
            background:
              radial-gradient(circle at 88% 20%, rgba(212, 255, 0, 0.18), transparent 38%),
              radial-gradient(circle at 10% 80%, rgba(212, 255, 0, 0.06), transparent 30%),
              linear-gradient(135deg, #111111 0%, #171717 54%, #0B0B0B 100%);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            position: relative;
            overflow: hidden;
          }

          .client-hero-soft::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(212, 255, 0, 0.08), transparent 22%);
            pointer-events: none;
          }

          .client-hero-soft > * {
            position: relative;
            z-index: 1;
          }

          .client-hero-soft h2 {
            margin: 0;
            font-size: 48px;
            letter-spacing: -0.04em;
          }

          .client-hero-soft p {
            max-width: 620px;
            margin: 10px 0 0;
            color: #A1A1A1;
            font-size: 20px;
          }

          .client-kicker {
            display: inline-flex;
            align-items: center;
            margin-bottom: 10px;
            color: var(--primary);
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .client-hero-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            min-width: 190px;
          }

          .client-hero-actions .primary-btn,
          .client-hero-actions .secondary-btn {
            width: 100%;
            justify-content: center;
          }

          .client-hero-actions .secondary-btn {
            color: #ffffff;
          }

          [data-theme="dark"] .client-hero-actions .secondary-btn {
            background: #ffffff;
            border-color: #ffffff;
            color: #111111;
          }

          [data-theme="dark"] .client-hero-actions .secondary-btn:hover {
            background: #f1f1f1;
            border-color: #f1f1f1;
            color: #111111;
          }

          .client-session-card {
            min-width: 300px;
            display: grid;
            grid-template-columns: 48px minmax(0, 1fr) 44px;
            align-items: center;
            gap: 12px;
            padding: 16px;
            border: 1.5px solid rgba(212, 255, 0, 0.2);
            border-radius: var(--radius-md);
            background: rgba(20, 20, 20, 0.95);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
          }

          .client-avatar {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            background: var(--primary);
            color: #111111;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 0 24px rgba(212, 255, 0, 0.28);
          }

          .client-theme-btn {
            width: 44px;
            height: 44px;
            display: grid;
            place-items: center;
            border: 1.5px solid rgba(212, 255, 0, 0.22);
            border-radius: 14px;
            background: rgba(212, 255, 0, 0.08);
            color: var(--primary);
            cursor: pointer;
            transition: all 0.2s var(--ease-out-expo);
          }

          .client-theme-btn:hover {
            border-color: var(--primary);
            background: rgba(212, 255, 0, 0.14);
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(212, 255, 0, 0.18);
          }

          .client-session-card strong,
          .client-session-card span {
            display: block;
          }

          .client-session-card span {
            margin-top: 2px;
            color: #A1A1A1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .client-logout-btn {
            grid-column: 1 / -1;
            width: 100%;
            justify-content: center;
            padding: 12px 18px;
            background: transparent;
            color: white;
            border-color: rgba(212, 255, 0, 0.22);
          }

          .client-business-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 20px;
          }

          .client-business-search {
            max-width: 520px;
            margin: 0 0 24px;
          }

          .client-business-tile {
            min-height: 190px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 12px;
            padding: 28px;
            border: 1.5px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--surface);
            color: var(--text);
            text-align: left;
            cursor: pointer;
            transition: all 0.25s var(--ease-out-expo);
            box-shadow: var(--shadow-sm);
          }

          .client-business-tile--tone-0,
          .client-business-tile--tone-1,
          .client-business-tile--tone-2,
          .client-business-tile--tone-3 {
            --tile-color: var(--primary);
          }

          .client-business-tile:hover,
          .client-business-tile--active {
            border-color: var(--primary);
            transform: translateY(-4px);
            box-shadow: 0 16px 40px rgba(212, 255, 0, 0.18);
            background: var(--surface);
          }

          .client-business-tile__title {
            font-size: 20px;
            font-weight: 900;
            color: var(--text);
          }

          .client-business-tile__address {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.4;
          }

          .client-business-tile__rating {
            display: flex;
            align-items: center;
            gap: 2px;
          }

          .client-star-btn {
            background: none;
            border: none;
            padding: 2px;
            cursor: pointer;
            color: var(--border-strong);
            transition: color 0.15s ease, transform 0.15s ease;
            line-height: 0;
          }

          .client-star-btn:hover,
          .client-star-btn--active {
            color: var(--primary);
          }

          .client-star-btn:hover {
            transform: scale(1.2);
          }

          .client-star-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--muted);
            margin-left: 6px;
          }

          .client-business-tile__hours {
            width: fit-content;
            border-radius: 999px;
            background: rgba(212, 255, 0, 0.1);
            border: 1.5px solid rgba(212, 255, 0, 0.3);
            color: var(--text);
            padding: 7px 14px;
            font-size: 13px;
            font-weight: 700;
          }

          .client-booking-panel {
            border: 1.5px solid var(--border);
          }

          .client-slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
            gap: 10px;
          }

          .client-slot {
            min-height: 48px;
            border: 1.5px solid rgba(212, 255, 0, 0.28);
            border-radius: var(--radius-sm);
            background:
              linear-gradient(135deg, rgba(212, 255, 0, 0.12), transparent 60%),
              var(--surface);
            color: var(--text);
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s var(--ease-out-expo);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .client-slot__icon {
            font-size: 14px;
            line-height: 1;
          }

          .client-slot--tone-0 { --slot-color: var(--primary); }
          .client-slot--tone-1 { --slot-color: var(--primary); }
          .client-slot--tone-2 { --slot-color: var(--primary); }
          .client-slot--tone-3 { --slot-color: var(--primary); }

          .client-slot:not(:disabled):hover {
            border-color: var(--slot-color);
            background: var(--primary);
            color: #111111;
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(212, 255, 0, 0.28);
          }

          .client-slot:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            text-decoration: line-through;
          }

          .client-slot--active {
            background: var(--slot-color);
            border-color: var(--slot-color);
            color: #111111;
            box-shadow: 0 0 26px rgba(212, 255, 0, 0.34);
          }

          .client-reservation-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .client-reservation-card {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 220px auto;
            align-items: center;
            gap: 18px;
            padding: 20px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background:
              linear-gradient(90deg, rgba(212, 255, 0, 0.18), transparent 46%),
              var(--surface);
            box-shadow: var(--shadow-sm);
            border-left: 5px solid var(--reservation-color);
          }

          .client-reservation-card--tone-0 { --reservation-color: var(--primary); }
          .client-reservation-card--tone-1 { --reservation-color: var(--primary); }
          .client-reservation-card--tone-2 { --reservation-color: var(--primary); }
          .client-reservation-card--tone-3 { --reservation-color: var(--primary); }

          .client-reservation-card h4 {
            margin: 4px 0;
            font-size: 22px;
          }

          .client-reservation-card p,
          .client-reservation-card span {
            margin: 0;
            color: var(--muted);
          }

          .client-reservation-card__meta {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            color: var(--reservation-color) !important;
          }

          .client-reservation-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            flex-wrap: wrap;
          }

          [data-theme="dark"] .client-business-tile__title {
            color: #FFFFFF;
          }

          [data-theme="dark"] .client-business-tile {
            background: var(--surface);
            border-color: var(--border);
          }

          [data-theme="dark"] .client-business-tile:hover,
          [data-theme="dark"] .client-business-tile--active {
            border-color: var(--primary);
          }

          [data-theme="dark"] .client-slot,
          [data-theme="dark"] .client-reservation-card {
            background: var(--surface);
          }

          [data-theme="dark"] .client-business-tile__address,
          [data-theme="dark"] .client-reservation-card p,
          [data-theme="dark"] .client-reservation-card span {
            color: var(--muted);
            opacity: 1;
          }

          [data-theme="dark"] .client-star-btn {
            color: var(--border-strong);
          }

          [data-theme="dark"] .client-session-card {
            background:
              linear-gradient(135deg, rgba(42, 42, 42, 0.9), rgba(17, 17, 17, 0.82)),
              #111111;
          }

          @media (max-width: 760px) {
            .client-hero-soft {
              flex-direction: column;
              align-items: stretch;
              padding: 24px;
            }

            .client-hero-soft h2 {
              font-size: 34px;
            }

            .client-hero-actions {
              width: 100%;
            }

            .client-session-card {
              min-width: 0;
            }

            .client-reservation-card {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className={`page-hero ${isBusiness ? "business-page-hero" : ""}`}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2>{isBusiness ? "Reservas del negocio" : isClient ? "Mis reservas" : "Listado de reservas"}</h2>
          <p>
            {isBusiness
              ? "Gestiona solo las reservas de tu negocio: confirma, cancela y valida pagos."
              : isClient
              ? "Consulta tus reservas y solicita una nueva cita."
              : "Gestion de reservas con cliente, negocio y pagos relacionados."}
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 3 }}>
          {isBusiness ? (
            <>
            <button type="button" className="primary-btn" onClick={openCreateForm}>
              Nueva reserva
            </button>
            <div className="business-session-card" style={{ display: "none" }} aria-hidden="true">
              <div className="business-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "N"}</div>
              <div>
                <strong>{user?.name ?? "Negocio"}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="business-notification-btn">
                <NotificationDropdown />
              </div>
              <button
                type="button"
                className="business-theme-btn"
                onClick={toggleTheme}
                title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              >
                {theme === "light" ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
              <button type="button" className="secondary-btn business-logout-btn" onClick={logout}>
                Cerrar sesión
              </button>
              <button type="button" className="primary-btn business-new-btn" onClick={openCreateForm}>
                Nueva reserva
              </button>
            </div>
            </>
          ) : (
            <button className="primary-btn" type="button" onClick={openCreateForm} disabled={isClient && !currentCustomer}>
              Nueva reserva
            </button>
          )}
        </div>

        <div style={{
          position: "absolute",
          top: "20px",
          right: "40px",
          opacity: 0.15,
          color: "var(--primary)",
          pointerEvents: "none",
          transform: "rotate(10deg)"
        }}>
          <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </section>

      <section className="kpi-grid">
        <StatsCard
          title={isBusiness ? "Reservas hoy" : isClient ? "Mis reservas" : "Total reservas"}
          value={String(isBusiness ? businessTodayBookings.length : counts.total)}
          subtitle={isBusiness ? "Pendientes o confirmadas" : "Registros disponibles"}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <StatsCard
          title="Pendientes"
          value={String(counts.pending)}
          subtitle="Requieren seguimiento"
          trend={{ value: "Check", positive: false }}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatsCard
          title="Confirmadas"
          value={String(counts.confirmed)}
          subtitle="Estado activo"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <StatsCard
          title="Completadas"
          value={String(counts.paid)}
          subtitle="Reservas cerradas"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
        />
      </section>

      {isBusiness ? (
        <div ref={businessPageRef} className="business-dashboard-grid">
          <section className="section-card business-animated">
            <div className="panel-title-row">
              <div>
                <h3 className="panel-title">Actividad reciente</h3>
                <p className="business-panel-copy">Reservas de los ultimos 7 dias y reparto por estado.</p>
              </div>
            </div>
            <div className="business-charts">
              <div className="business-chart">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={businessActivityData}>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }} />
                    <Bar dataKey="reservas" fill="var(--primary)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="business-chart business-chart--compact">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={businessStatusChart} dataKey="value" innerRadius={56} outerRadius={88} paddingAngle={6}>
                      {businessStatusChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="business-chart-legend">
                  {businessStatusChart.map((entry) => (
                    <span key={entry.name}>
                      <i style={{ background: entry.color }} />
                      {entry.name}: {entry.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="section-card business-animated">
            <div className="panel-title-row">
              <div>
                <h3 className="panel-title">Horario del negocio</h3>
                <p className="business-panel-copy">{currentBusiness?.name ?? "Tu negocio"}</p>
              </div>
            </div>
            <form onSubmit={handleBusinessScheduleSubmit} className="business-schedule-form">
              <label>
                Apertura
                <input
                  className="input"
                  type="time"
                  value={businessScheduleForm.openingTime}
                  onChange={(e) => setBusinessScheduleForm((prev) => ({ ...prev, openingTime: e.target.value }))}
                  required
                />
              </label>
              <label>
                Cierre
                <input
                  className="input"
                  type="time"
                  value={businessScheduleForm.closingTime}
                  onChange={(e) => setBusinessScheduleForm((prev) => ({ ...prev, closingTime: e.target.value }))}
                  required
                />
              </label>
              <button className="primary-btn" type="submit" disabled={savingSchedule || !currentBusiness}>
                {savingSchedule ? "Guardando..." : "Guardar horario"}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {isBusiness ? (
        <section className="section-card business-animated">
          <div className="panel-title-row">
            <div>
              <h3 className="panel-title">Calendario y disponibilidad</h3>
              <p className="business-panel-copy">Selecciona un dia para ver sus reservas.</p>
            </div>
            <div className="business-calendar-actions">
              <button type="button" className="business-month-btn" onClick={() => changeBusinessMonth(-1)} title="Mes anterior">
                ‹
              </button>
              <input
                className="input business-date-input"
                type="date"
                value={businessSelectedDate}
                onChange={(e) => selectBusinessCalendarDate(e.target.value)}
              />
              <button type="button" className="business-month-btn" onClick={() => changeBusinessMonth(1)} title="Mes siguiente">
                ›
              </button>
            </div>
          </div>
          <div className="business-calendar-layout">
            <div className="business-month-grid">
              {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
                <div key={day} className="business-weekday">{day}</div>
              ))}
              {businessMonthDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="business-day business-day--empty" />;
                }

                const dayBookings = visibleBookings.filter((booking) => booking.date.startsWith(date));
                const isSelected = date === businessSelectedDate;
                const hasBookings = dayBookings.length > 0;
                const allSlotsBooked = currentBusiness ? dayBookings.length >= buildHourlySlots(currentBusiness).length : false;

                return (
                  <button
                    key={date}
                    type="button"
                    className={`business-day ${isSelected ? "business-day--active" : ""} ${hasBookings ? "business-day--busy" : ""}`}
                    onClick={() => selectBusinessCalendarDate(date)}
                  >
                    <span>{formatWeekday(date)}</span>
                    <strong>{date.slice(-2)}</strong>
                    <small>{allSlotsBooked ? "Ocupado" : hasBookings ? `${dayBookings.length} reservas` : "Libre"}</small>
                  </button>
                );
              })}
            </div>
            <div className="business-month-switcher">
              <span>Mes seleccionado</span>
              <strong>{formatMonthLabel(businessSelectedDate)}</strong>
              <div className="business-month-controls">
                <button type="button" className="business-month-btn" onClick={() => changeBusinessMonth(-1)} title="Mes anterior">
                  {"<"}
                </button>
                <button type="button" className="business-month-btn" onClick={() => changeBusinessMonth(1)} title="Mes siguiente">
                  {">"}
                </button>
              </div>
              <input
                className="input business-date-input"
                type="date"
                value={businessSelectedDate}
                onChange={(e) => selectBusinessCalendarDate(e.target.value)}
              />
            </div>
            <div className="business-slots-panel">
              <h4>{formatShortDay(businessSelectedDate)}</h4>
              <div className="business-day-summary">
                <span>{businessSelectedDateBookings.length} reservas</span>
                <span>{businessSlots.filter((slot) => !slot.isBooked).length} horas libres</span>
                <span>{currentBusiness?.openingTime} - {currentBusiness?.closingTime}</span>
              </div>
              <div className="business-slot-grid">
                {businessSlots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    className={`business-slot ${slot.isBooked ? "business-slot--booked" : ""} ${createForm.time === slot.value ? "business-slot--active" : ""}`}
                    disabled={slot.isBooked}
                    onClick={() => {
                      setCreateForm((prev) => ({
                        ...prev,
                        date: businessSelectedDate,
                        time: slot.value,
                        businessId: user?.businessId ?? prev.businessId,
                      }));
                      setIsCreateOpen(true);
                    }}
                  >
                    <strong>{slot.value}</strong>
                    <span>{slot.isBooked ? getCustomerName(slot.booking as Booking) : "Libre"}</span>
                  </button>
                ))}
              </div>
              <div className="business-day-bookings">
                <h5>Reservas del dia</h5>
                {businessSelectedDateBookings.length > 0 ? (
                  businessSelectedDateBookings
                    .slice()
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((booking) => (
                      <div key={booking.id} className="business-day-booking">
                        <div>
                          <strong>{booking.time.slice(0, 5)} · {booking.serviceName}</strong>
                          <span>{getCustomerName(booking)} · {getPaymentMethodLabel(booking)}</span>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                    ))
                ) : (
                  <p>No hay reservas registradas para este dia.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isCreateOpen ? (
        <section ref={createFormSectionRef} className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            {renderBookingForm(createForm, updateCreateForm, true)}
            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isClient && !isBusiness && editingBookingId !== null ? (
        <section id="edit-booking-form" className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
            <button type="button" className="secondary-btn" onClick={closeEditForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
          {renderBookingForm(editForm, updateEditForm)}
            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}
            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isClient && deleteTargetId !== null && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDeleteModal();
            }}
          >
            <div className="modal-card">
              <div className="modal-icon">!</div>
              <h3 id="delete-modal-title" className="modal-title">
                Eliminar reserva
              </h3>
              <p id="delete-modal-description" className="modal-text">
                ¿Seguro que quieres eliminar la reserva #{deleteTargetId}? Esta acción no se puede deshacer.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeDeleteModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={confirmDelete}
                  disabled={deletingBookingId === deleteTargetId}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {deletingBookingId === deleteTargetId ? (
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

      <section className="section-card">
        <div className="panel-title-row">
          <div>
            <h3 className="panel-title">Reservas registradas</h3>
            {isBusiness ? (
              <p className="business-panel-copy">{formatShortDay(businessSelectedDate)}</p>
            ) : null}
          </div>
          <div className="filter-row">
            <button type="button" className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("all")}>{isBusiness ? "Dia seleccionado" : "Todas"}</button>
            <button type="button" className={`filter-pill ${statusFilter === "pendiente" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("pendiente")}>Pendientes</button>
            <button type="button" className={`filter-pill ${statusFilter === "confirmado" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("confirmado")}>Confirmadas</button>
            {!isBusiness ? (
              <button type="button" className={`filter-pill ${statusFilter === "completado" ? "filter-pill--active" : ""}`} onClick={() => setStatusFilter("completado")}>Completadas</button>
            ) : null}
          </div>
        </div>

        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage ? <div className="message-error" style={{ marginBottom: 12 }}>{errorMessage}</div> : null}

        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable-header" onClick={() => requestBookingSort('id')}>ID {renderBookingSortIcon('id')}</th>
              <th className="sortable-header" onClick={() => requestBookingSort('date')}>Fecha {renderBookingSortIcon('date')}</th>
              <th className="sortable-header" onClick={() => requestBookingSort('time')}>Hora {renderBookingSortIcon('time')}</th>
              <th className="sortable-header" onClick={() => requestBookingSort('serviceName')}>Servicio {renderBookingSortIcon('serviceName')}</th>
              {!isClient ? <th className="sortable-header" onClick={() => requestBookingSort('customerName')}>Cliente {renderBookingSortIcon('customerName')}</th> : null}
              <th className="sortable-header" onClick={() => requestBookingSort('paymentMethodName')}>Metodo de pago {renderBookingSortIcon('paymentMethodName')}</th>
              <th className="sortable-header" onClick={() => requestBookingSort('status')}>Estado {renderBookingSortIcon('status')}</th>
              {!isClient ? <th style={{ textAlign: "right" }}>Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedBookings.length > 0 ? sortedBookings.map((booking) => (
              <tr key={booking.id}>
                <td style={{ fontWeight: 700, color: "var(--muted)" }}>#{booking.id}</td>
                <td>{formatDate(booking.date)}</td>
                <td>{booking.time}</td>
                <td style={{ fontWeight: 600 }}>{booking.serviceName}</td>
                {!isClient ? <td>{getCustomerName(booking)}</td> : null}
                <td>{getPaymentMethodLabel(booking)}</td>
                <td><StatusBadge status={booking.status} /></td>
                {!isClient ? <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {isBusiness ? (
                      <>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: "8px 16px" }}
                          disabled={businessActionId === booking.id || booking.status === "confirmado" || booking.status === "completado"}
                          onClick={() => handleBusinessStatus(booking, "confirmado")}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.18)", color: "#FF3B30" }}
                          disabled={businessActionId === booking.id || booking.status === "cancelado" || booking.status === "completado"}
                          onClick={() => handleBusinessStatus(booking, "cancelado")}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="primary-btn"
                          style={{ padding: "8px 16px", fontSize: "13px" }}
                          disabled={businessActionId === booking.id || !getPendingPayment(booking)}
                          onClick={() => handleBusinessPayment(booking)}
                        >
                          Confirmar pago
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.18)", color: "#FF3B30" }}
                          disabled={businessActionId === booking.id}
                          onClick={() => openDeleteModal(booking.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="secondary-btn" style={{ padding: "8px 16px" }} onClick={() => openEditForm(booking)}>
                          Editar
                        </button>
                        <button type="button" className="secondary-btn" style={{ padding: "8px 16px", borderColor: "rgba(255, 59, 48, 0.1)", color: "#FF3B30" }} onClick={() => openDeleteModal(booking.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td> : null}
              </tr>
            )) : (
              <tr>
                <td colSpan={isClient ? 6 : 8} style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
                  <div style={{ fontSize: "28px", marginBottom: 8, opacity: 0.4 }}>∅</div>
                  {isBusiness ? "No hay reservas para el dia seleccionado." : "No hay reservas para este filtro."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <style jsx>{`
        .business-page-hero {
          overflow: visible;
          z-index: 40;
        }

        .business-session-card {
          min-width: 300px;
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) 44px 44px;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1.5px solid rgba(212, 255, 0, 0.26);
          border-radius: var(--radius-md);
          background:
            linear-gradient(135deg, rgba(30, 30, 30, 0.92), rgba(17, 17, 17, 0.82)),
            #111111;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
        }

        .business-avatar {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: var(--primary);
          color: #111111;
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 0 24px rgba(212, 255, 0, 0.28);
        }

        .business-session-card strong,
        .business-session-card span {
          display: block;
        }

        .business-session-card strong {
          color: white;
        }

        .business-session-card span {
          margin-top: 2px;
          color: #A1A1A1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .business-theme-btn {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1.5px solid rgba(212, 255, 0, 0.22);
          border-radius: 14px;
          background: rgba(212, 255, 0, 0.08);
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-expo);
        }

        .business-theme-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(212, 255, 0, 0.18);
        }

        .business-logout-btn {
          grid-column: 1 / -1;
          width: 100%;
          justify-content: center;
          padding: 12px 18px;
          background: transparent;
          color: white;
          border-color: rgba(212, 255, 0, 0.22);
        }

        .business-logout-btn:hover {
          background: #FF3B30;
          color: white;
          border-color: #FF3B30;
          box-shadow: 0 10px 24px rgba(255, 59, 48, 0.28);
        }

        .business-new-btn {
          grid-column: 1 / -1;
          width: 100%;
          justify-content: center;
          padding: 12px 18px;
        }

        .business-dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.8fr);
          gap: 24px;
        }

        .business-panel-copy {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 14px;
          font-weight: 700;
        }

        .business-charts {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
          gap: 20px;
        }

        .business-chart {
          min-height: 280px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px;
          background: var(--bg);
        }

        .business-chart--compact {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .business-chart-legend {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
          margin-top: 8px;
        }

        .business-chart-legend span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 800;
        }

        .business-chart-legend i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .business-schedule-form {
          display: grid;
          gap: 16px;
        }

        .business-schedule-form label {
          display: grid;
          gap: 8px;
          color: var(--muted);
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .business-date-input {
          max-width: 220px;
        }

        .business-calendar-actions {
          display: none;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .business-month-switcher {
          align-self: stretch;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-width: 150px;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg);
          text-align: center;
        }

        .business-month-switcher span {
          color: var(--muted);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .business-month-switcher strong {
          max-width: 130px;
          font-size: 18px;
          font-weight: 900;
          text-transform: capitalize;
        }

        .business-month-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .business-month-btn {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1.5px solid var(--border);
          border-radius: 14px;
          background: var(--surface);
          color: var(--text);
          font-size: 28px;
          line-height: 1;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-expo);
        }

        .business-notification-btn {
          width: 44px;
          height: 44px;
          position: relative;
          z-index: 5;
        }

        .business-notification-btn :global(.notification-dropdown) {
          right: 0 !important;
          z-index: 5000 !important;
        }

        .business-notification-btn :global(.theme-toggle-btn) {
          width: 44px !important;
          height: 44px !important;
          border-radius: 14px !important;
          border-color: rgba(212, 255, 0, 0.22) !important;
          background: rgba(212, 255, 0, 0.08) !important;
          color: var(--primary) !important;
        }

        .business-month-btn:hover {
          border-color: var(--primary);
          background: var(--primary);
          color: #111111;
          transform: translateY(-2px);
        }

        .business-calendar-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) auto minmax(280px, 0.8fr);
          gap: 24px;
        }

        .business-month-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(72px, 1fr));
          gap: 10px;
        }

        .business-weekday {
          padding: 0 10px 6px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          text-align: center;
        }

        .business-day,
        .business-slot {
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-expo);
        }

        .business-day {
          min-height: 92px;
          padding: 12px;
          display: grid;
          justify-items: start;
          align-content: space-between;
          text-align: left;
        }

        .business-day--empty {
          background: transparent;
          border-color: transparent;
          pointer-events: none;
        }

        .business-day span,
        .business-slot span {
          color: var(--muted);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .business-day small {
          display: block;
          max-width: 100%;
          color: var(--muted);
          font-size: 10px;
          font-weight: 800;
          line-height: 1.1;
          overflow-wrap: anywhere;
          text-transform: uppercase;
        }

        .business-day strong {
          font-size: 24px;
          line-height: 1;
        }

        .business-day:hover,
        .business-slot:hover:not(:disabled) {
          border-color: var(--primary);
          transform: translateY(-2px);
        }

        .business-day--busy {
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.1), transparent), var(--surface);
        }

        .business-day--active,
        .business-slot--active {
          border-color: var(--primary);
          background: var(--primary);
          color: #111111;
          box-shadow: 0 10px 24px rgba(212, 255, 0, 0.2);
        }

        .business-day--active span,
        .business-day--active small,
        .business-slot--active span {
          color: #111111;
        }

        .business-slots-panel {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg);
          padding: 20px;
        }

        .business-slots-panel h4 {
          margin: 0 0 16px;
          font-size: 22px;
        }

        .business-slot-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .business-day-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .business-day-summary span {
          padding: 10px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 12px;
          font-weight: 800;
          text-align: center;
        }

        .business-slot {
          min-height: 72px;
          padding: 12px;
          display: grid;
          justify-items: start;
          align-content: center;
          gap: 4px;
        }

        .business-slot:disabled {
          cursor: not-allowed;
        }

        .business-slot--booked {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.22);
        }

        .business-day-bookings {
          margin-top: 20px;
          display: grid;
          gap: 10px;
        }

        .business-day-bookings h5 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
        }

        .business-day-bookings p {
          margin: 0;
          color: var(--muted);
          font-weight: 700;
        }

        .business-day-booking {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--surface);
        }

        .business-day-booking strong,
        .business-day-booking span {
          display: block;
        }

        .business-day-booking strong {
          font-size: 14px;
        }

        .business-day-booking span {
          margin-top: 3px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 760px) {
          .business-session-card {
            min-width: 0;
          }

          .business-dashboard-grid,
          .business-charts,
          .business-calendar-layout {
            grid-template-columns: 1fr;
          }

          .business-month-grid {
            grid-template-columns: repeat(7, minmax(58px, 1fr));
            overflow-x: auto;
          }

          .business-date-input {
            max-width: none;
          }

          .business-calendar-actions {
            justify-content: stretch;
          }

          .business-calendar-actions .business-date-input {
            flex: 1;
          }

          .business-day {
            min-height: 82px;
            padding: 10px;
          }

          .business-day-summary,
          .business-slot-grid {
            grid-template-columns: 1fr;
          }

          .business-day-booking {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      {alertMessage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "grid",
            placeItems: "center",
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setAlertMessage(null)}
        >
          <div
            className="alert alert-warning alert-dismissible show fade"
            role="alert"
            style={{
              background: "#fff3cd",
              color: "#664d03",
              border: "1px solid #ffecb5",
              padding: "24px 48px 24px 24px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              maxWidth: "420px",
              width: "90%",
              position: "relative",
              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "28px", lineHeight: 1 }}>⚠️</span>
              <div style={{ textAlign: "left" }}>
                <strong style={{ fontSize: "16px", fontWeight: 800, display: "block", marginBottom: "4px" }}>
                  Lo siento
                </strong>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  {alertMessage}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                lineHeight: 1,
                cursor: "pointer",
                color: "#664d03",
                opacity: 0.7,
                padding: "4px",
                fontWeight: "bold",
              }}
              onClick={() => setAlertMessage(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
