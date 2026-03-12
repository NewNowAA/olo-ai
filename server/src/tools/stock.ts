// =============================================
// Olo.AI — Stock Tools Implementation
// =============================================

import * as store from '../services/supabaseStore.js';

export async function check_stock(orgId: string, args: { product_name: string }) {
  const items = await store.searchCatalog(orgId, args.product_name, undefined, 5);

  if (items.length === 0) {
    return {
      found: false,
      message: `Não encontrei o produto "${args.product_name}".`,
    };
  }

  const item = items[0];

  if (item.stock_quantity === null || item.stock_quantity === undefined) {
    return {
      found: true,
      name: item.name,
      stock_tracked: false,
      message: `O stock de "${item.name}" não está a ser controlado.`,
    };
  }

  return {
    found: true,
    name: item.name,
    stock_quantity: item.stock_quantity,
    stock_min_alert: item.stock_min_alert,
    is_low: item.stock_quantity <= item.stock_min_alert,
    available: item.is_available,
    message: item.stock_quantity <= item.stock_min_alert
      ? `⚠️ Stock baixo: "${item.name}" tem apenas ${item.stock_quantity} unidades.`
      : `"${item.name}" tem ${item.stock_quantity} unidades em stock.`,
  };
}

export async function update_stock(orgId: string, args: { product_name: string; new_quantity: number }) {
  const items = await store.searchCatalog(orgId, args.product_name, undefined, 5);

  if (items.length === 0) {
    return {
      success: false,
      message: `Não encontrei o produto "${args.product_name}".`,
    };
  }

  const item = items[0];
  const success = await store.updateStock(item.id, args.new_quantity);

  return {
    success,
    name: item.name,
    previous_quantity: item.stock_quantity,
    new_quantity: args.new_quantity,
    message: success
      ? `Stock de "${item.name}" atualizado para ${args.new_quantity} unidades.`
      : `Erro ao atualizar stock de "${item.name}".`,
  };
}

export async function stock_alerts(orgId: string) {
  const lowStockItems = await store.getStockAlerts(orgId);

  if (lowStockItems.length === 0) {
    return {
      alerts: false,
      message: 'Todos os produtos estão com stock dentro do normal. 👍',
      items: [],
    };
  }

  return {
    alerts: true,
    count: lowStockItems.length,
    items: lowStockItems.map(item => ({
      name: item.name,
      stock_quantity: item.stock_quantity,
      min_alert: item.stock_min_alert,
    })),
    message: `⚠️ ${lowStockItems.length} produto(s) com stock baixo.`,
  };
}
