// =============================================
// Olo.AI — Worker Tools (Time Clock & Schedule)
// =============================================

import * as store from '../services/supabaseStore.js';
import { TIMEZONE } from '../config/constants.js';

export async function worker_checkin(orgId: string, workerId: string) {
  if (!workerId) {
    return { success: false, message: 'Não foi possível identificar o teu perfil de colaborador.' };
  }

  // Prevent double check-in
  const openSession = await store.getOpenWorkSession(workerId);
  if (openSession) {
    const checkInTime = new Date(openSession.check_in).toLocaleTimeString('pt-PT', {
      hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
    });
    return {
      success: false,
      already_checked_in: true,
      check_in_time: checkInTime,
      message: `Já tens entrada registada desde as ${checkInTime}. Regista a saída primeiro.`,
    };
  }

  const session = await store.createWorkSession(orgId, workerId);
  if (!session) {
    return { success: false, message: 'Erro ao registar entrada. Tenta novamente.' };
  }

  const checkInTime = new Date(session.check_in).toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  });

  return {
    success: true,
    session_id: session.id,
    check_in_time: checkInTime,
    message: `✅ Entrada registada às ${checkInTime}. Bom trabalho!`,
  };
}

export async function worker_checkout(orgId: string, workerId: string, args: { notes?: string }) {
  if (!workerId) {
    return { success: false, message: 'Não foi possível identificar o teu perfil de colaborador.' };
  }

  const openSession = await store.getOpenWorkSession(workerId);
  if (!openSession) {
    return {
      success: false,
      no_open_session: true,
      message: 'Não tens nenhuma entrada registada. Faz o check-in primeiro.',
    };
  }

  const ok = await store.closeWorkSession(openSession.id, args.notes);
  if (!ok) {
    return { success: false, message: 'Erro ao registar saída. Tenta novamente.' };
  }

  const checkInTime = new Date(openSession.check_in).toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  });
  const checkOutTime = new Date().toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  });

  const durationMs = Date.now() - new Date(openSession.check_in).getTime();
  const totalMins = Math.round(durationMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

  return {
    success: true,
    session_id: openSession.id,
    check_in_time: checkInTime,
    check_out_time: checkOutTime,
    duration_minutes: totalMins,
    message: `✅ Saída registada às ${checkOutTime}. Trabalhaste ${durationStr} hoje. Até amanhã! 👋`,
  };
}

export async function get_my_schedule(orgId: string, workerId: string, args: { days?: number }) {
  if (!workerId) {
    return { success: false, message: 'Não foi possível identificar o teu perfil de colaborador.' };
  }

  const daysBack = Math.min(args.days || 7, 30);
  const dateFrom = new Date(Date.now() - daysBack * 86400000).toISOString();
  const sessions = await store.getWorkSessions(orgId, workerId, dateFrom);

  if (sessions.length === 0) {
    return {
      success: true,
      sessions: [],
      message: `Não encontrei registos de ponto nos últimos ${daysBack} dias.`,
    };
  }

  let totalMins = 0;
  const formatted = sessions.map((s: any) => {
    const checkIn = new Date(s.check_in);
    const checkOut = s.check_out ? new Date(s.check_out) : null;
    const durationMins = checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : null;
    if (durationMins) totalMins += durationMins;
    return {
      date: checkIn.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: TIMEZONE }),
      check_in: checkIn.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }),
      check_out: checkOut
        ? checkOut.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })
        : 'Em curso',
      duration: durationMins ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}min` : '—',
    };
  });

  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;

  return {
    success: true,
    period_days: daysBack,
    sessions: formatted,
    total_sessions: sessions.length,
    total_hours: `${h}h ${m}min`,
    message: `Tens ${sessions.length} registo(s) nos últimos ${daysBack} dias. Total: ${h}h ${m}min.`,
  };
}
