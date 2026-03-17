// =============================================
// Olo.AI — Handoff & Customer Info Tools
// =============================================

import * as store from '../services/supabaseStore.js';
import * as notifier from '../services/ownerNotifier.js';

export async function transfer_to_human(
  orgId: string,
  args: { reason?: string },
  customerId?: string,
  conversationId?: string
) {
  if (!conversationId) {
    return {
      success: false,
      message: 'Não foi possível iniciar a transferência. Tenta novamente.',
    };
  }

  const handoff = await store.createHandoffRequest(
    orgId,
    conversationId,
    customerId,
    args.reason
  );

  if (!handoff) {
    return {
      success: false,
      message: 'Erro ao criar pedido de transferência.',
    };
  }

  // Notify owner (fire-and-forget)
  notifier.notifyHandoff(orgId, 'Cliente', args.reason).catch(() => {});

  return {
    success: true,
    handoff_id: handoff.id,
    message: '🔔 A tua conversa foi transferida para um membro da equipa. Alguém irá responder-te em breve. Obrigado pela paciência!',
    inline_buttons: [
      { text: '✅ Sim, transferir', callback_data: `confirm_handoff|${handoff.id}` },
      { text: '❌ Não, continuar com IA', callback_data: `cancel_handoff|${handoff.id}` },
    ],
  };
}

export async function save_customer_info(
  orgId: string,
  args: { name?: string; phone?: string; email?: string; notes?: string },
  customerId?: string
) {
  if (!customerId) {
    return {
      success: false,
      message: 'Cliente não identificado.',
    };
  }

  const updates: Record<string, any> = {};
  if (args.name) updates.name = args.name;
  if (args.phone) updates.phone = args.phone;
  if (args.email) updates.email = args.email;
  if (args.notes) updates.notes = args.notes;

  if (Object.keys(updates).length === 0) {
    return {
      success: false,
      message: 'Nenhuma informação para guardar.',
    };
  }

  await store.updateCustomer(customerId, updates);

  return {
    success: true,
    updated_fields: Object.keys(updates),
    message: `Informação do cliente atualizada: ${Object.keys(updates).join(', ')}.`,
  };
}
