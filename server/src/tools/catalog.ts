// =============================================
// Olo.AI — Catalog Tools Implementation
// =============================================

import * as store from '../services/supabaseStore.js';

export async function search_catalog(orgId: string, args: { query?: string; category?: string }) {
  const items = await store.searchCatalog(orgId, args.query, undefined, 10);

  if (items.length === 0) {
    return {
      found: false,
      message: args.query
        ? `Não encontrei resultados para "${args.query}".`
        : 'O catálogo ainda não tem itens registados.',
      items: [],
    };
  }

  return {
    found: true,
    count: items.length,
    items: items.map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      currency: item.currency,
      category: (item as any).catalog_categories?.name || 'Sem categoria',
      available: item.active,
      stock: item.stock_quantity,
    })),
  };
}

export async function get_product_details(orgId: string, args: { product_name: string }) {
  const items = await store.searchCatalog(orgId, args.product_name, undefined, 5);

  if (items.length === 0) {
    return {
      found: false,
      message: `Não encontrei o produto/serviço "${args.product_name}".`,
    };
  }

  const item = items[0];
  return {
    found: true,
    name: item.name,
    description: item.description,
    price: item.price,
    currency: item.currency,
    unit: item.unit,
    category: (item as any).catalog_categories?.name || 'Sem categoria',
    available: item.active,
    stock: item.stock_quantity !== null ? item.stock_quantity : 'Não controlado',
    tags: item.tags,
  };
}

export async function list_categories(orgId: string) {
  const categories = await store.getCategories(orgId);

  if (categories.length === 0) {
    return {
      found: false,
      message: 'Ainda não existem categorias configuradas.',
      categories: [],
    };
  }

  return {
    found: true,
    count: categories.length,
    categories: categories.map(c => ({
      name: c.name,
      description: c.description,
    })),
  };
}
