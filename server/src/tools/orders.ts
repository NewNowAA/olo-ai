// =============================================
// Olo.AI — Orders Tools Implementation
// =============================================

import * as store from '../services/supabaseStore.js';

export async function create_order(
  orgId: string,
  args: {
    items: { name: string; quantity: number }[];
    delivery_type?: string;
    notes?: string;
  },
  customerId?: string,
  conversationId?: string
) {
  if (!args.items || args.items.length === 0) {
    return {
      success: false,
      message: 'Nenhum item foi especificado no pedido.',
    };
  }

  // Resolve items from catalog
  const resolvedItems: { name: string; quantity: number; unit_price: number; total_price: number; catalog_item_id?: string }[] = [];
  let totalAmount = 0;
  const notFound: string[] = [];

  for (const item of args.items) {
    const catalogItems = await store.searchCatalog(orgId, item.name, undefined, 1);

    if (catalogItems.length > 0) {
      const catalogItem = catalogItems[0];
      const total = catalogItem.price * item.quantity;
      resolvedItems.push({
        name: catalogItem.name,
        quantity: item.quantity,
        unit_price: catalogItem.price,
        total_price: total,
        catalog_item_id: catalogItem.id,
      });
      totalAmount += total;
    } else {
      notFound.push(item.name);
    }
  }

  if (resolvedItems.length === 0) {
    return {
      success: false,
      message: `Não encontrei nenhum dos itens no catálogo: ${notFound.join(', ')}.`,
      not_found: notFound,
    };
  }

  // Create the order
  const order = await store.createOrder(
    {
      org_id: orgId,
      customer_id: customerId,
      conversation_id: conversationId,
      status: 'pending',
      total_amount: totalAmount,
      currency: 'AOA',
      notes: args.notes,
      delivery_type: args.delivery_type || 'takeaway',
    },
    resolvedItems.map(item => ({
      catalog_item_id: item.catalog_item_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))
  );

  if (!order) {
    return {
      success: false,
      message: 'Erro ao criar o pedido. Tenta novamente.',
    };
  }

  let message = `✅ Pedido criado com sucesso!\n\n`;
  message += resolvedItems.map(i => `• ${i.quantity}x ${i.name} — ${i.total_price.toLocaleString()} AOA`).join('\n');
  message += `\n\n**Total: ${totalAmount.toLocaleString()} AOA**`;
  if (args.delivery_type) message += `\nTipo: ${args.delivery_type}`;

  if (notFound.length > 0) {
    message += `\n\n⚠️ Não encontrei: ${notFound.join(', ')}`;
  }

  return {
    success: true,
    order_id: order.id,
    total: totalAmount,
    currency: 'AOA',
    items: resolvedItems,
    not_found: notFound,
    message,
    inline_buttons: [
      { text: '✅ Confirmar Pedido', callback_data: `confirm_order|${order.id}` },
      { text: '❌ Cancelar', callback_data: `cancel_order|${order.id}` },
    ],
  };
}
