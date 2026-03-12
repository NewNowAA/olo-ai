// =============================================
// Olo.AI — Persona Engine (3-Layer System)
// =============================================
// Layer 1: Role Persona (dev/owner/client)
// Layer 2: Sector Persona (restaurante/clinica/salao/generico)
// Layer 3: Custom Persona (owner's config)

import { Organization, UserContext, Customer } from '../types/index.js';
import { getBasePrompt, getRolePrompt } from '../config/prompts.js';
import { getSectorConfig } from '../config/sectors.js';

export interface PersonaResult {
  systemPrompt: string;
  activeTools: string[];
  guardrailsExtra: string[];
}

export function buildPersona(
  org: Organization,
  userContext: UserContext,
  customer?: Customer | null
): PersonaResult {
  const sectorConfig = getSectorConfig(org.sector);

  // --- Layer 1: Base + Role ---
  const basePrompt = getBasePrompt();
  const rolePrompt = getRolePrompt(userContext.role);

  // --- Layer 2: Sector ---
  let sectorPrompt = sectorConfig.basePersona;

  // Replace template variables
  sectorPrompt = sectorPrompt
    .replace(/{agent_name}/g, org.agent_name || 'Olo')
    .replace(/{business_name}/g, org.business_name || org.name || 'o negócio');

  // --- Layer 3: Custom (owner's config) ---
  let customPrompt = '';
  if (org.agent_system_prompt) {
    customPrompt = `\nINSTRUÇÕES PERSONALIZADAS DO DONO DO NEGÓCIO:\n${org.agent_system_prompt}`;
  }

  if (org.agent_tone) {
    customPrompt += `\nTom de voz preferido: ${org.agent_tone}`;
  }

  // --- Customer context (for client role) ---
  let customerContext = '';
  if (userContext.role === 'client' && customer) {
    customerContext = `\nCONTEXTO DO CLIENTE:`;
    if (customer.name) customerContext += `\n- Nome: ${customer.name}`;
    if (customer.notes) customerContext += `\n- Notas: ${customer.notes}`;
    if (customer.tags?.length) customerContext += `\n- Tags: ${customer.tags.join(', ')}`;
    customerContext += `\n- Total de conversas anteriores: ${customer.total_conversations}`;
  }

  // --- Business context ---
  let businessContext = `\nINFO DO NEGÓCIO:
- Nome: ${org.business_name || org.name || '[Não configurado]'}
- Setor: ${org.sector}
- Atendente: ${org.agent_name || 'Olo'}`;

  if (org.address) businessContext += `\n- Morada: ${org.address}`;
  if (org.phone) businessContext += `\n- Telefone: ${org.phone}`;

  // --- Guardrails extras ---
  let guardrailsText = '';
  if (sectorConfig.guardrailsExtra.length > 0) {
    guardrailsText = `\nREGRAS EXTRA DO SETOR:\n${sectorConfig.guardrailsExtra.map(g => `- ${g}`).join('\n')}`;
  }

  // --- Assemble final system prompt ---
  const systemPrompt = [
    basePrompt,
    rolePrompt,
    `\nPERSONA DO SETOR (${org.sector}):`,
    sectorPrompt,
    customPrompt,
    businessContext,
    customerContext,
    guardrailsText,
  ].filter(Boolean).join('\n');

  // --- Determine active tools based on role ---
  let activeTools = [...sectorConfig.activeTools];

  if (userContext.role === 'dev') {
    // Dev gets all tools
    activeTools = [
      'search_catalog', 'get_product_details', 'list_categories',
      'check_stock', 'update_stock', 'stock_alerts',
      'check_availability', 'create_appointment', 'cancel_appointment', 'list_appointments',
      'get_business_info', 'transfer_to_human', 'create_order', 'save_customer_info'
    ];
  } else if (userContext.role === 'owner') {
    // Owner also gets management tools
    if (!activeTools.includes('update_stock')) activeTools.push('update_stock');
    if (!activeTools.includes('stock_alerts')) activeTools.push('stock_alerts');
    if (!activeTools.includes('list_appointments')) activeTools.push('list_appointments');
  }

  return {
    systemPrompt,
    activeTools,
    guardrailsExtra: sectorConfig.guardrailsExtra,
  };
}

// --- Build greeting message ---
export function getGreeting(org: Organization, customerName?: string): string {
  if (org.agent_greeting) {
    return org.agent_greeting
      .replace(/{customer_name}/g, customerName || 'amigo(a)')
      .replace(/{agent_name}/g, org.agent_name || 'Olo')
      .replace(/{business_name}/g, org.business_name || org.name || '');
  }

  const name = customerName ? `, ${customerName}` : '';
  const agentName = org.agent_name || 'Olo';
  const bizName = org.business_name || org.name || 'o negócio';

  return `Olá${name}! 👋 Sou ${agentName}, assistente virtual d${bizName}. Como posso ajudar-te hoje?`;
}
