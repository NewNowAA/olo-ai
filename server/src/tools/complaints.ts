// =============================================
// Olo.AI — Complaints Tool
// =============================================

import * as store from '../services/supabaseStore.js';
import * as notifier from '../services/ownerNotifier.js';

export async function file_complaint(
  orgId: string,
  args: { subject: string; details?: string },
  customerId?: string,
  conversationId?: string
) {
  if (!args.subject?.trim()) {
    return {
      success: false,
      message: 'Por favor descreve o motivo da tua reclamação.',
    };
  }

  const { data, error } = await store.getSupabase()
    .from('complaints')
    .insert({
      org_id: orgId,
      customer_id: customerId || null,
      conversation_id: conversationId || null,
      subject: args.subject,
      details: args.details || null,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('[file_complaint] DB error:', error);
    return {
      success: false,
      message: 'Não foi possível registar a reclamação. Tenta novamente ou contacta o negócio diretamente.',
    };
  }

  // Notify owner (fire-and-forget)
  notifier.notifyNewComplaint(orgId, 'Cliente', args.subject).catch(() => {});

  return {
    success: true,
    complaint_id: data.id,
    message: `✅ A tua reclamação foi registada com sucesso. O negócio irá analisá-la e entrar em contacto contigo. Obrigado pelo teu feedback!`,
  };
}
