// =============================================
// Olo.AI — Policy Guard (Safety Guardrails)
// =============================================

import { Role } from '../types/index.js';

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  filtered?: string; // sanitized content if partially allowed
}

// --- Content Filters ---
const NSFW_PATTERNS = [
  /\b(porn|xxx|nude|naked|sex\s*chat)\b/i,
];

const SENSITIVE_DATA_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
  /\bpassword\s*[:=]\s*\S+/i,
  /\bsenha\s*[:=]\s*\S+/i,
];

const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\b(diagnóstico|diagnostico|diagnose|prescrev|medicar|medicação|medicamento)\b/i,
];

// --- Policy Check: Input (user message) ---
export function checkInputPolicy(
  content: string,
  role: Role
): PolicyResult {
  // NSFW check (all roles)
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(content)) {
      return { allowed: false, reason: 'Conteúdo impróprio detectado. Não posso responder a este tipo de mensagem.' };
    }
  }

  return { allowed: true };
}

// --- Policy Check: Output (AI response) ---
export function checkOutputPolicy(
  content: string,
  role: Role,
  sector?: string
): PolicyResult {
  // Never expose sensitive data in output
  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: true,
        filtered: content.replace(pattern, '[DADOS PROTEGIDOS]'),
        reason: 'Dados sensíveis filtrados da resposta.'
      };
    }
  }

  // Medical sector: block diagnosis in client responses
  if (sector === 'clinica' && role === 'client') {
    for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
      if (pattern.test(content)) {
        return {
          allowed: true,
          filtered: content + '\n\n⚠️ _Nota: Esta informação é apenas referencial. Consulte sempre um profissional de saúde._',
          reason: 'Aviso médico adicionado.'
        };
      }
    }
  }

  return { allowed: true };
}

// --- Policy Check: Tool calls ---
export function checkToolPolicy(
  toolName: string,
  role: Role,
  allowedTools: string[]
): PolicyResult {
  // Check if tool is allowed for this sector
  if (!allowedTools.includes(toolName)) {
    return { allowed: false, reason: `Tool "${toolName}" não está disponível para este tipo de negócio.` };
  }

  // Owner/dev-only tools (workers and clients cannot use)
  const ownerOnlyTools = ['update_stock', 'stock_alerts'];
  if (ownerOnlyTools.includes(toolName) && role !== 'owner' && role !== 'dev') {
    return { allowed: false, reason: `Esta função está disponível apenas para o gestor do negócio.` };
  }

  // Worker-only tools (clients and owners don't need these)
  const workerOnlyTools = ['worker_checkin', 'worker_checkout', 'get_my_schedule'];
  if (workerOnlyTools.includes(toolName) && role !== 'worker' && role !== 'dev') {
    return { allowed: false, reason: `Esta função está disponível apenas para colaboradores.` };
  }

  return { allowed: true };
}

// --- Conversation Limits ---
export const LIMITS = {
  MAX_CONTEXT_MESSAGES: 20,
  MAX_TOOL_CALLS_PER_MESSAGE: 5,
  MAX_MESSAGE_LENGTH: 4096,
  MAX_RESPONSE_LENGTH: 4096,
};

export function checkConversationLimits(
  toolCallCount: number,
  messageCount: number
): PolicyResult {
  if (toolCallCount >= LIMITS.MAX_TOOL_CALLS_PER_MESSAGE) {
    return {
      allowed: false,
      reason: `Limite de ${LIMITS.MAX_TOOL_CALLS_PER_MESSAGE} operações por mensagem atingido.`
    };
  }

  return { allowed: true };
}

// --- Truncate message to sliding window ---
export function applySlidingWindow<T>(messages: T[], maxMessages: number = LIMITS.MAX_CONTEXT_MESSAGES): T[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
}
