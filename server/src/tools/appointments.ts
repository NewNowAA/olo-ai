// =============================================
// Olo.AI — Appointments Tools Implementation
// =============================================

import * as store from '../services/supabaseStore.js';

export async function check_availability(orgId: string, args: { date: string; service?: string }) {
  // Get existing appointments for the date
  const appointments = await store.getAppointments(orgId, args.date);
  const busyTimes = appointments
    .filter(a => a.status !== 'cancelled')
    .map(a => ({ start: a.time_start, end: a.time_end }));

  // Get business hours for this day
  const dayOfWeek = new Date(args.date).getDay();
  const allHours = await store.getBusinessHours(orgId);
  const dayHours = allHours.find(h => h.day_of_week === dayOfWeek);

  if (!dayHours || dayHours.is_closed) {
    return {
      available: false,
      message: `O negócio está fechado no dia ${args.date}.`,
      busy_times: [],
      open_time: null,
      close_time: null,
    };
  }

  return {
    available: true,
    date: args.date,
    open_time: dayHours.open_time,
    close_time: dayHours.close_time,
    existing_appointments: busyTimes.length,
    busy_times: busyTimes,
    message: busyTimes.length > 0
      ? `No dia ${args.date}, há ${busyTimes.length} marcação(ões) existente(s). O horário é das ${dayHours.open_time} às ${dayHours.close_time}.`
      : `O dia ${args.date} está disponível! Horário: ${dayHours.open_time} - ${dayHours.close_time}.`,
  };
}

export async function create_appointment(
  orgId: string,
  args: { date: string; time: string; service?: string; customer_name?: string; notes?: string },
  customerId?: string
) {
  // Find service in catalog if provided
  let serviceId: string | undefined;
  if (args.service) {
    const items = await store.searchCatalog(orgId, args.service, undefined, 1);
    if (items.length > 0) {
      serviceId = items[0].id;
    }
  }

  const appointment = await store.createAppointment({
    org_id: orgId,
    customer_id: customerId,
    service_id: serviceId,
    date: args.date,
    time_start: args.time,
    status: 'confirmed',
    notes: args.notes,
    source: 'bot',
  });

  if (!appointment) {
    return {
      success: false,
      message: 'Não foi possível criar a marcação. Tenta novamente ou contacta o negócio diretamente.',
    };
  }

  return {
    success: true,
    appointment_id: appointment.id,
    date: args.date,
    time: args.time,
    service: args.service || 'Geral',
    message: `✅ Marcação confirmada para ${args.date} às ${args.time}${args.service ? ` (${args.service})` : ''}.`,
    inline_buttons: [
      { text: '✅ Confirmar', callback_data: `confirm_appointment|${appointment.id}` },
      { text: '❌ Cancelar', callback_data: `cancel_appointment|${appointment.id}` },
    ],
  };
}

export async function cancel_appointment(
  orgId: string,
  args: { appointment_date: string; appointment_time?: string },
  customerId?: string
) {
  // Find appointments matching criteria
  const appointments = await store.getAppointments(orgId, args.appointment_date);
  let toCancel = appointments.filter(a =>
    a.status !== 'cancelled' &&
    (!customerId || a.customer_id === customerId)
  );

  if (args.appointment_time) {
    toCancel = toCancel.filter(a => a.time_start === args.appointment_time);
  }

  if (toCancel.length === 0) {
    return {
      success: false,
      message: `Não encontrei nenhuma marcação para ${args.appointment_date}${args.appointment_time ? ` às ${args.appointment_time}` : ''}.`,
    };
  }

  if (toCancel.length > 1) {
    return {
      success: false,
      message: `Encontrei ${toCancel.length} marcações no dia ${args.appointment_date}. Podes indicar o horário para eu identificar qual queres cancelar?`,
      appointments: toCancel.map(a => ({
        date: a.date,
        time: a.time_start,
        status: a.status,
      })),
    };
  }

  const cancelled = await store.cancelAppointment(toCancel[0].id);

  return {
    success: cancelled,
    message: cancelled
      ? `✅ Marcação de ${args.appointment_date} às ${toCancel[0].time_start} foi cancelada.`
      : 'Não foi possível cancelar a marcação. Tenta novamente.',
  };
}

export async function list_appointments(
  orgId: string,
  args: { date?: string; status?: string },
  customerId?: string
) {
  const appointments = await store.getAppointments(orgId, args.date, args.status);

  // If client, filter to their own appointments
  let filtered = appointments;
  if (customerId) {
    filtered = appointments.filter(a => a.customer_id === customerId);
  }

  if (filtered.length === 0) {
    return {
      found: false,
      message: args.date
        ? `Não há marcações para ${args.date}.`
        : 'Não há marcações registadas.',
    };
  }

  return {
    found: true,
    count: filtered.length,
    appointments: filtered.map(a => ({
      date: a.date,
      time: a.time_start,
      status: a.status,
      service: a.service_id || 'Geral',
      customer: (a as any).customers?.name || 'Cliente',
      notes: a.notes,
    })),
  };
}
