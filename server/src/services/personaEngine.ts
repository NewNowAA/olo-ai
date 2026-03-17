// =============================================
// Olo.AI — Persona Engine (3-Layer System)
// =============================================
// Layer 1: Role Persona (dev/owner/client)
// Layer 2: Sector Persona (restaurante/clinica/salao/generico)
// Layer 3: Custom Persona (owner's config)

import { Organization, UserContext, Customer } from '../types/index.js';
import { getBasePrompt, getRolePrompt } from '../config/prompts.js';
import { getSectorConfig } from '../config/sectors.js';
import * as store from './supabaseStore.js';

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

  // Replace template variables with smart defaults
  const agentName = org.agent_name || 'Agente IA';
  const businessName = org.business_name || org.name || 'nosso estabelecimento';
  
  sectorPrompt = sectorPrompt
    .replace(/{agent_name}/g, agentName)
    .replace(/{business_name}/g, businessName);

  // --- Layer 3: Custom (owner's config) ---
  let customPrompt = '';
  if (org.agent_system_prompt) {
    customPrompt = `\nINSTRUÇÕES PERSONALIZADAS DO DONO DO NEGÓCIO:\n${org.agent_system_prompt}`;
  }

  const TONE_DESCRIPTIONS: Record<string, string> = {
    amigavel: 'caloroso, informal, usa expressões locais, empático, usa emojis',
    intermedio: 'amigável mas profissional, equilibrado, usa emojis com moderação',
    profissional: 'formal, objetivo, sem emojis, linguagem cuidada',
  };
  const agentTone = org.agent_tone ? (TONE_DESCRIPTIONS[org.agent_tone] || org.agent_tone) : 'profissional e amigável';
  customPrompt += `\nTom de voz preferido: ${agentTone}`;

  // Log setup notifications if missing configurations
  if (!org.agent_name || org.agent_name.trim() === '') {
    store.logSetupNotification(org.id, 'Dica: Personalize o nome do seu atendente virtual para os seus clientes!');
  }
  if (!org.business_name || org.business_name.trim() === '') {
    store.logSetupNotification(org.id, 'Dica: Adicione o nome comercial do seu negócio para o atendente usar nas mensagens.');
  }
  if (!org.agent_tone || org.agent_tone.trim() === '') {
    store.logSetupNotification(org.id, 'Dica: Configure o tom de voz do atendente (ex: divertido, formal, etc.).');
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

  // --- Worker context ---
  let workerContext = '';
  if (userContext.role === 'worker') {
    const perms = userContext.workerPermissions;
    workerContext = `\nCONTEXTO DO COLABORADOR:`;
    workerContext += `\n- ID: ${userContext.workerId}`;
    const permList = [];
    if (perms?.see_catalog) permList.push('catálogo');
    if (perms?.see_stock) permList.push('stock');
    if (perms?.see_appointments) permList.push('marcações');
    if (perms?.see_customers) permList.push('clientes');
    workerContext += `\n- Permissões: ${permList.length > 0 ? permList.join(', ') : 'apenas ponto eletrónico'}`;
    workerContext += `\n- Para registar entrada, usa worker_checkin. Para saída, usa worker_checkout.`;
  }

  // --- Business context ---
  let businessContext = `\nINFO DO NEGÓCIO:
- Nome: ${businessName}
- Setor: ${org.sector}
- Atendente: ${agentName}`;

  if (org.address) {
    businessContext += `\n- Morada: ${org.address}`;
  } else {
    store.logSetupNotification(org.id, 'Dica: Adicione a morada do seu negócio para que o atendente possa partilhar com clientes.');
  }
  
  if (org.phone) {
    businessContext += `\n- Telefone: ${org.phone}`;
  } else {
    store.logSetupNotification(org.id, 'Dica: Adicione o seu número de telefone oficial.');
  }

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
    workerContext,
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
      'get_business_info', 'transfer_to_human', 'create_order', 'save_customer_info',
      'worker_checkin', 'worker_checkout', 'get_my_schedule', 'file_complaint',
    ];
  } else if (userContext.role === 'owner') {
    // Owner also gets management tools
    if (!activeTools.includes('update_stock')) activeTools.push('update_stock');
    if (!activeTools.includes('stock_alerts')) activeTools.push('stock_alerts');
    if (!activeTools.includes('list_appointments')) activeTools.push('list_appointments');
  } else if (userContext.role === 'worker') {
    // Worker gets time-clock tools always + conditional tools based on permissions
    const workerTools = ['worker_checkin', 'worker_checkout', 'get_my_schedule', 'get_business_info'];
    const perms = userContext.workerPermissions;
    if (perms?.see_catalog) workerTools.push('search_catalog', 'get_product_details', 'list_categories');
    if (perms?.see_stock) workerTools.push('check_stock');
    if (perms?.see_appointments) workerTools.push('check_availability', 'list_appointments');
    if (perms?.see_customers) workerTools.push('save_customer_info');
    activeTools = workerTools;
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
