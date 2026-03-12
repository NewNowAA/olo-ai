// =============================================
// Olo.AI — Business Info Tools Implementation
// =============================================

import { Organization } from '../types/index.js';
import * as store from '../services/supabaseStore.js';
import * as placeholderManager from '../services/placeholderManager.js';

export async function get_business_info(
  orgId: string,
  args: { field?: string },
  org: Organization
) {
  const field = args.field || 'all';
  const result: Record<string, any> = {};

  // --- Hours ---
  if (field === 'hours' || field === 'all') {
    const hours = await store.getBusinessHours(orgId);
    if (hours.length === 0) {
      const placeholder = await placeholderManager.checkPlaceholder(org, 'business_hours');
      result.hours = {
        configured: false,
        ...placeholder,
      };
    } else {
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      result.hours = {
        configured: true,
        schedule: hours.map(h => ({
          day: dayNames[h.day_of_week],
          open: h.is_closed ? 'Fechado' : h.open_time,
          close: h.is_closed ? 'Fechado' : h.close_time,
        })),
      };
    }
  }

  // --- Address ---
  if (field === 'address' || field === 'all') {
    if (!org.address) {
      const placeholder = await placeholderManager.checkPlaceholder(org, 'address');
      result.address = { configured: false, ...placeholder };
    } else {
      result.address = { configured: true, value: org.address };
    }
  }

  // --- Phone ---
  if (field === 'phone' || field === 'all') {
    if (!org.phone) {
      const placeholder = await placeholderManager.checkPlaceholder(org, 'phone');
      result.phone = { configured: false, ...placeholder };
    } else {
      result.phone = { configured: true, value: org.phone };
    }
  }

  // --- Business Name ---
  if (field === 'all') {
    result.name = org.business_name || org.name || '[Não configurado]';
    result.sector = org.sector;
  }

  // Check if any requested field is missing
  const hasMissing = Object.values(result).some((v: any) => v?.configured === false || v?.missing);

  return {
    business_name: org.business_name || org.name,
    ...result,
    has_missing_info: hasMissing,
    message: hasMissing
      ? 'Algumas informações do negócio ainda não estão configuradas.'
      : 'Todas as informações solicitadas estão disponíveis.',
  };
}
