// =============================================
// Olo.AI — Appointments Tools Implementation
// =============================================

import * as store from '../services/supabaseStore.js';
import * as notifier from '../services/ownerNotifier.js';

// Check if a proposed time slot overlaps with existing appointments
function hasOverlap(
  existingAppts: any[],
  proposedStart: Date,
  proposedEnd: Date
): boolean {
  return existingAppts
    .filter(a => a.status !== 'cancelled')
    .some(a => {
      if (!a.datetime) return false;
      const existStart = new Date(a.datetime);
      const existEnd = a.end_time ? new Date(a.end_time) : new Date(existStart.getTime() + 60 * 60 * 1000);
      // Overlap if proposed start < existing end AND proposed end > existing start
      return proposedStart < existEnd && proposedEnd > existStart;
    });
}

export async function check_availability(orgId: string, args: { date: string; service?: string }) {
  // Get existing appointments for the date
  const appointments = await store.getAppointments(orgId, args.date);
  const busyTimes = appointments
    .filter(a => a.status !== 'cancelled')
    .map(a => ({ start: a.time_start, end: a.time_end }));

  // Get business hours for this day
  // DB stores 0=Monday..6=Sunday, JS Date uses 0=Sunday..6=Saturday
  const jsDay = new Date(args.date + 'T12:00:00').getDay(); // use noon to avoid TZ drift
  const dbDay = jsDay === 0 ? 6 : jsDay - 1; // convert JS Sunday=0 → DB Sunday=6
  const allHours = await store.getBusinessHours(orgId);
  const dayHours = allHours.find(h => h.day_of_week === dbDay);

  if (!dayHours || dayHours.is_closed) {
    return {
      available: false,
      message: `O negócio está fechado no dia ${args.date}.`,
      busy_times: [],
      open_time: null,
      close_time: null,
    };
  }

  // Generate available 1-hour slots
  const openH = parseInt(dayHours.open_time.split(':')[0]);
  const closeH = parseInt(dayHours.close_time.split(':')[0]);
  const availableSlots: string[] = [];

  for (let h = openH; h < closeH; h++) {
    const slotStart = new Date(`${args.date}T${String(h).padStart(2, '0')}:00:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    // Raw appointments from DB (not mapped) needed for overlap check
    const rawAppts = await store.getSupabase()
      .from('appointments')
      .select('datetime, end_time, status')
      .eq('org_id', orgId)
      .gte('datetime', `${args.date}T00:00:00`)
      .lt('datetime', `${args.date}T23:59:59`);

    if (!hasOverlap(rawAppts.data || [], slotStart, slotEnd)) {
      availableSlots.push(`${String(h).padStart(2, '0')}:00`);
    }
  }

  return {
    available: availableSlots.length > 0,
    date: args.date,
    open_time: dayHours.open_time,
    close_time: dayHours.close_time,
    existing_appointments: busyTimes.length,
    busy_times: busyTimes,
    available_slots: availableSlots,
    message: availableSlots.length > 0
      ? `No dia ${args.date}, há ${availableSlots.length} horário(s) disponível(is): ${availableSlots.join(', ')}.`
      : `O dia ${args.date} está completamente ocupado. Por favor escolha outro dia.`,
  };
}

export async function create_appointment(
  orgId: string,
  args: { date: string; time: string; service?: string; customer_name?: string; notes?: string },
  customerId?: string
) {
  // Build proposed start/end datetime
  const proposedStart = new Date(`${args.date}T${args.time}:00`);
  const proposedEnd = new Date(proposedStart.getTime() + 60 * 60 * 1000);

  // Check for overlaps
  const { data: rawAppts } = await store.getSupabase()
    .from('appointments')
    .select('datetime, end_time, status')
    .eq('org_id', orgId)
    .gte('datetime', `${args.date}T00:00:00`)
    .lt('datetime', `${args.date}T23:59:59`);

  if (hasOverlap(rawAppts || [], proposedStart, proposedEnd)) {
    return {
      success: false,
      message: `O horário ${args.time} do dia ${args.date} já está ocupado. Escolha outro horário.`,
    };
  }

  // Find service name from catalog if provided
  let serviceName = args.service || 'Geral';
  if (args.service) {
    const items = await store.searchCatalog(orgId, args.service, undefined, 1);
    if (items.length > 0) {
      serviceName = items[0].name;
    }
  }

  const appointment = await store.createAppointment({
    org_id: orgId,
    customer_id: customerId,
    service_name: serviceName,
    date: args.date,
    time_start: args.time,
    status: 'pending', // Pre-reserved — owner must confirm
    notes: args.notes,
    source: 'bot',
  });

  if (!appointment) {
    return {
      success: false,
      message: 'Não foi possível criar a marcação. Tenta novamente ou contacta o negócio diretamente.',
    };
  }

  // Notify owner (fire-and-forget)
  const customerName = args.customer_name || 'Cliente';
  notifier.notifyNewAppointment(orgId, customerName, serviceName, args.date, args.time).catch(() => {});

  return {
    success: true,
    appointment_id: appointment.id,
    date: args.date,
    time: args.time,
    service: serviceName,
    message: `✅ Pedido de marcação enviado para ${args.date} às ${args.time}${args.service ? ` (${serviceName})` : ''}. Aguarda confirmação do negócio.`,
    inline_buttons: [
      { text: '❌ Cancelar pedido', callback_data: `cancel_appointment|${appointment.id}` },
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
        service: a.service_name || 'Geral',
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
      id: a.id,
      date: a.date,
      time: a.time_start,
      status: a.status,
      service: a.service_name || 'Geral',
      customer: (a as any).customers?.name || 'Cliente',
      notes: a.notes,
    })),
  };
}
