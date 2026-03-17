// =============================================
// Olo.AI — Owner Notifier
// =============================================
// Sends Telegram notifications to the business owner
// when important events happen (new booking, order, handoff, etc.)

import * as store from './supabaseStore.js';
import { sendMessage } from './telegramGateway.js';

async function getOwnerContext(orgId: string): Promise<{ botToken: string; chatId: string } | null> {
  const org = await store.getOrganization(orgId);
  if (!org) return null;
  const botToken = org.telegram_bot_token;
  const chatId = org.telegram_chat_id;
  if (!botToken || !chatId) return null;
  return { botToken, chatId };
}

export async function notifyNewAppointment(
  orgId: string,
  customerName: string,
  service: string,
  date: string,
  time: string
): Promise<void> {
  try {
    const ctx = await getOwnerContext(orgId);
    if (!ctx) return;
    await sendMessage(
      ctx.botToken,
      ctx.chatId,
      `📅 *Nova marcação*\n👤 Cliente: ${customerName}\n🛠️ Serviço: ${service}\n🗓️ Data: ${date} às ${time}\n\nAcede ao dashboard para confirmar.`
    );
  } catch (err) {
    console.error('[OwnerNotifier] notifyNewAppointment error:', err);
  }
}

export async function notifyNewOrder(
  orgId: string,
  customerName: string,
  items: string,
  total: number
): Promise<void> {
  try {
    const ctx = await getOwnerContext(orgId);
    if (!ctx) return;
    await sendMessage(
      ctx.botToken,
      ctx.chatId,
      `🛒 *Novo pedido*\n👤 Cliente: ${customerName}\n📦 Itens: ${items}\n💰 Total: ${total.toLocaleString()} AOA`
    );
  } catch (err) {
    console.error('[OwnerNotifier] notifyNewOrder error:', err);
  }
}

export async function notifyHandoff(
  orgId: string,
  customerName: string,
  reason?: string
): Promise<void> {
  try {
    const ctx = await getOwnerContext(orgId);
    if (!ctx) return;
    await sendMessage(
      ctx.botToken,
      ctx.chatId,
      `🔀 *Um cliente precisa de ti!*\n👤 Cliente: ${customerName}${reason ? `\n📝 Motivo: ${reason}` : ''}\n\nAcede ao dashboard para responder.`
    );
  } catch (err) {
    console.error('[OwnerNotifier] notifyHandoff error:', err);
  }
}

export async function notifyLowStock(
  orgId: string,
  productName: string,
  quantity: number
): Promise<void> {
  try {
    const ctx = await getOwnerContext(orgId);
    if (!ctx) return;
    await sendMessage(
      ctx.botToken,
      ctx.chatId,
      `⚠️ *Stock baixo*\n📦 Produto: ${productName}\n🔢 Quantidade restante: ${quantity}`
    );
  } catch (err) {
    console.error('[OwnerNotifier] notifyLowStock error:', err);
  }
}

export async function notifyNewComplaint(
  orgId: string,
  customerName: string,
  subject: string
): Promise<void> {
  try {
    const ctx = await getOwnerContext(orgId);
    if (!ctx) return;
    await sendMessage(
      ctx.botToken,
      ctx.chatId,
      `⚠️ *Nova reclamação*\n👤 Cliente: ${customerName}\n📝 Assunto: ${subject}\n\nAcede ao dashboard para ver os detalhes.`
    );
  } catch (err) {
    console.error('[OwnerNotifier] notifyNewComplaint error:', err);
  }
}
