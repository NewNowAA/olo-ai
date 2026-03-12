// =============================================
// Olo.AI — Placeholder Manager
// Detects missing business config and notifies
// =============================================

import { Organization, PlaceholderResult } from '../types/index.js';
import * as store from './supabaseStore.js';

interface PlaceholderDef {
  field: string;
  label: string;
  priority: 'P0' | 'P1' | 'P2';
  checkFn: (org: Organization, extras?: any) => boolean; // true = MISSING
  clientMessage: string;
  ownerMessage: string;
}

const PLACEHOLDER_DEFS: PlaceholderDef[] = [
  {
    field: 'business_name',
    label: 'Nome do negócio',
    priority: 'P0',
    checkFn: (org) => !org.business_name && !org.name,
    clientMessage: 'Ainda não tenho o nome do negócio configurado. Posso passar-te para o responsável?',
    ownerMessage: '⚠️ O nome do teu negócio ainda não está configurado. Diz-me o nome e eu guardo!',
  },
  {
    field: 'sector',
    label: 'Setor do negócio',
    priority: 'P0',
    checkFn: (org) => !org.sector || org.sector === 'generico',
    clientMessage: '',
    ownerMessage: '⚠️ O tipo de negócio (restaurante, clínica, salão, etc.) ainda não está definido. Qual é o teu setor?',
  },
  {
    field: 'business_hours',
    label: 'Horário de funcionamento',
    priority: 'P0',
    checkFn: (_org, extras) => !extras?.hasBusinessHours,
    clientMessage: 'Ainda não tenho o horário de funcionamento configurado. Posso passar-te para o responsável?',
    ownerMessage: '⚠️ Um cliente perguntou pelo horário mas ainda não configuraste. Queres definir agora? (ex: "Seg a Sex 9h-18h, Sáb 10h-14h")',
  },
  {
    field: 'catalog_items',
    label: 'Produtos/serviços',
    priority: 'P1',
    checkFn: (_org, extras) => !extras?.hasCatalogItems,
    clientMessage: 'Ainda não tenho a lista de serviços/produtos configurada. Posso passar-te para o responsável?',
    ownerMessage: '⚠️ O teu catálogo de produtos/serviços está vazio. Queres adicionar os teus primeiros itens?',
  },
  {
    field: 'address',
    label: 'Morada',
    priority: 'P2',
    checkFn: (org) => !org.address,
    clientMessage: 'Ainda não tenho a morada guardada. Posso passar-te para o responsável?',
    ownerMessage: '💡 A morada do teu negócio ainda não está configurada. Qual é a tua morada?',
  },
  {
    field: 'phone',
    label: 'Telefone',
    priority: 'P2',
    checkFn: (org) => !org.phone,
    clientMessage: 'Ainda não tenho o contacto telefónico disponível.',
    ownerMessage: '💡 O telefone do teu negócio ainda não está configurado.',
  },
  {
    field: 'agent_greeting',
    label: 'Mensagem de boas-vindas',
    priority: 'P2',
    checkFn: (org) => !org.agent_greeting,
    clientMessage: '',
    ownerMessage: '💡 Podes personalizar a mensagem de boas-vindas do teu atendente. Queres definir uma?',
  },
];

// --- Check if a specific field is a placeholder ---
export async function checkPlaceholder(
  org: Organization,
  field: string
): Promise<PlaceholderResult | null> {
  const def = PLACEHOLDER_DEFS.find(p => p.field === field);
  if (!def) return null;

  const extras = await getExtras(org.id);
  const isMissing = def.checkFn(org, extras);

  if (!isMissing) return null;

  return {
    missing: true,
    field: def.field,
    priority: def.priority,
    message: def.clientMessage,
  };
}

// --- Get all missing placeholders ---
export async function getMissingPlaceholders(org: Organization): Promise<PlaceholderResult[]> {
  const extras = await getExtras(org.id);
  const missing: PlaceholderResult[] = [];

  for (const def of PLACEHOLDER_DEFS) {
    if (def.checkFn(org, extras)) {
      missing.push({
        missing: true,
        field: def.field,
        priority: def.priority,
        message: def.ownerMessage,
      });
    }
  }

  return missing;
}

// --- Calculate setup progress (0-100) ---
export async function calculateSetupProgress(org: Organization): Promise<number> {
  const extras = await getExtras(org.id);
  let completed = 0;
  let total = 0;

  for (const def of PLACEHOLDER_DEFS) {
    total++;
    if (!def.checkFn(org, extras)) {
      completed++;
    }
  }

  return Math.round((completed / total) * 100);
}

// --- Helper: get extra data for checks ---
async function getExtras(orgId: string): Promise<{ hasBusinessHours: boolean; hasCatalogItems: boolean }> {
  const hours = await store.getBusinessHours(orgId);
  const catalog = await store.searchCatalog(orgId, undefined, undefined, 1);

  return {
    hasBusinessHours: hours.length > 0,
    hasCatalogItems: catalog.length > 0,
  };
}

// --- Get owner notification messages for missing items ---
export function getOwnerNotification(field: string): string {
  const def = PLACEHOLDER_DEFS.find(p => p.field === field);
  return def?.ownerMessage || `⚠️ O campo "${field}" ainda não está configurado.`;
}
