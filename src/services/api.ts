// =============================================
// Olo.AI — API Client (calls Express backend)
// =============================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

export const getOrg = (orgId: string) =>
  request<any>(`/org/${orgId}`);

export const updateOrg = (orgId: string, data: any) =>
  request<any>(`/orgs/${orgId}`, { method: 'PUT', body: JSON.stringify(data) });

export const setupTelegram = (orgId: string, bot_token: string) =>
  request<any>(`/orgs/${orgId}/setup-telegram`, { method: 'POST', body: JSON.stringify({ bot_token }) });

export const getPreviewMode = (orgId: string) =>
  request<{ mode: 'owner' | 'client' }>(`/orgs/${orgId}/preview-mode`);

export const setPreviewMode = (orgId: string, mode: 'owner' | 'client') =>
  request<{ mode: 'owner' | 'client' }>(`/orgs/${orgId}/preview-mode`, { method: 'POST', body: JSON.stringify({ mode }) });

export const getOrgSetupProgress = (orgId: string) =>
  request<any>(`/org/${orgId}/setup`);

// --- Dashboard Stats ---
export const getStats = (orgId: string) =>
  request<any>(`/orgs/${orgId}/stats`);

// --- Catalog ---
export const getCatalog = (orgId: string) =>
  request<any[]>(`/org/${orgId}/catalog`);

export const createCatalogItem = (orgId: string, data: any) =>
  request<any>(`/orgs/${orgId}/catalog`, { method: 'POST', body: JSON.stringify(data) });

export const getCategories = (orgId: string) =>
  request<any[]>(`/orgs/${orgId}/catalog/categories`);

export const createCategory = (orgId: string, name: string) =>
  request<any>(`/orgs/${orgId}/catalog/categories`, { method: 'POST', body: JSON.stringify({ name }) });

export const updateCatalogItem = (orgId: string, itemId: string, data: any) =>
  request<any>(`/orgs/${orgId}/catalog/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCatalogItem = (orgId: string, itemId: string) =>
  request<void>(`/orgs/${orgId}/catalog/${itemId}`, { method: 'DELETE' });

// --- Stock ---
export const getStock = (orgId: string) =>
  request<any>(`/orgs/${orgId}/stock`);

export const registerStockMovement = (orgId: string, data: any) =>
  request<any>(`/orgs/${orgId}/stock/movement`, { method: 'POST', body: JSON.stringify(data) });

// --- Conversations ---
export const getConversations = (orgId: string) =>
  request<any[]>(`/org/${orgId}/conversations`);

export const getConversationMessages = (convId: string) =>
  request<any[]>(`/conversations/${convId}/messages`);

export const sendOwnerMessage = (orgId: string, convId: string, content: string) =>
  request<any>(`/orgs/${orgId}/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

// --- Appointments ---
export const getAppointments = (orgId: string, params?: { date?: string; status?: string }) => {
  const qs = new URLSearchParams(params as any).toString();
  return request<any[]>(`/org/${orgId}/appointments${qs ? '?' + qs : ''}`);
};

export const createAppointment = (orgId: string, data: any) =>
  request<any>(`/orgs/${orgId}/appointments`, { method: 'POST', body: JSON.stringify(data) });

export const updateAppointment = (orgId: string, id: string, data: any) =>
  request<any>(`/orgs/${orgId}/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// --- Customers ---
export const getCustomers = (orgId: string) =>
  request<any[]>(`/org/${orgId}/customers`);

export const createCustomer = (orgId: string, data: any) =>
  request<any>(`/orgs/${orgId}/customers`, { method: 'POST', body: JSON.stringify(data) });

// --- Business Hours ---
export const getBusinessHours = (orgId: string) =>
  request<any[]>(`/orgs/${orgId}/hours`);

export const updateBusinessHours = (orgId: string, hours: any[]) =>
  request<any>(`/orgs/${orgId}/hours`, { method: 'PUT', body: JSON.stringify({ hours }) });

// --- Stock Alerts ---
export const getStockAlerts = (orgId: string) =>
  request<any>(`/org/${orgId}/stock-alerts`);

// --- Admin (Dev only) ---
export const getAdminStats = () =>
  request<any>(`/admin/stats`);

export const getAdminOrganizations = () =>
  request<any[]>(`/admin/organizations`);

// --- Sector Templates ---
export const getSectorTemplates = () =>
  request<any>(`/public/sectors/templates`);

// --- Quick Replies ---
export const getQuickReplies = (orgId: string) =>
  request<any[]>(`/orgs/${orgId}/quick-replies`);

export const createQuickReply = (orgId: string, data: any) =>
  request<any>(`/orgs/${orgId}/quick-replies`, { method: 'POST', body: JSON.stringify(data) });

// --- Feedbacks ---
export const sendFeedback = (data: { message: string, url?: string, org_id?: string | null }) =>
  request<any>(`/feedbacks`, { method: 'POST', body: JSON.stringify(data) });
