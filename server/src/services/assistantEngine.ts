// =============================================
// Olo.AI — Assistant Engine (Main Orchestrator)
// =============================================
//
// Flow:
// 1. Receive message + user context
// 2. Build persona (3-layer system prompt)
// 3. Load conversation history (sliding window)
// 4. Send to Gemini with tool declarations
// 5. Process tool calls (loop, max 5)
// 6. Return final response
//

import { GoogleGenerativeAI, Content, Part, FunctionCall } from '@google/generative-ai';
import { UserContext, Organization, Customer, Conversation, Message, InlineButton } from '../types/index.js';
import { buildPersona, getGreeting } from './personaEngine.js';
import { executeTool } from './toolExecutor.js';
import { getToolDeclarations } from '../tools/definitions.js';
import * as store from './supabaseStore.js';
import { checkInputPolicy, checkOutputPolicy, checkConversationLimits, applySlidingWindow, LIMITS } from './policyGuard.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface MessageOptions {
  isCallbackQuery?: boolean;
}

export interface AssistantResponse {
  text: string;
  toolCalls: { name: string; args: any; result: any }[];
  tokensUsed: number;
  conversationId: string;
  inlineButtons?: InlineButton[];
}

export async function handleMessage(
  messageText: string,
  userContext: UserContext,
  org: Organization,
  customer: Customer | null,
  options?: MessageOptions
): Promise<AssistantResponse> {
  // --- 1. Input Policy Check ---
  const inputPolicy = checkInputPolicy(messageText, userContext.role);
  if (!inputPolicy.allowed) {
    return {
      text: inputPolicy.reason || 'Não posso processar esta mensagem.',
      toolCalls: [],
      tokensUsed: 0,
      conversationId: '',
    };
  }

  // --- 2. Get or create conversation ---
  let conversation: Conversation | null = null;
  if (userContext.customerId) {
    const externalChatId = userContext.telegramId || userContext.whatsappId || 'unknown';
    conversation = await store.getOrCreateConversation(
      org.id,
      userContext.customerId,
      userContext.channel,
      externalChatId
    );
  }

  const conversationId = conversation?.id || '';

  // --- 3. Save user message ---
  if (conversationId) {
    await store.saveMessage(conversationId, 'user', messageText, { org_id: org.id });
  }

  // --- 4. Build persona ---
  const persona = buildPersona(org, userContext, customer);

  // --- Smart Logic (Fast Paths without LLM) ---
  if (conversationId) {
    // A) First Contact Message
    // NOTE: user message was already saved above, so history has exactly 1 message for a first contact
    const history = await store.getConversationMessages(conversationId, 2);
    if (history.length <= 1) {
      let greeting = org.first_contact_message;
      if (!greeting) {
        greeting = `Olá! Bem-vindo ao atendimento de ${org.business_name || 'nosso estabelecimento'}. Como posso ajudar hoje?`;
        await store.logSetupNotification(org.id, 'Dica: Personalize a sua mensagem de primeiro contacto para dar boas-vindas com a sua marca.');
      }
      
      await store.saveMessage(conversationId, 'assistant', greeting, { org_id: org.id });
      return { text: greeting, toolCalls: [], tokensUsed: 0, conversationId };
    }

    // B) Absence Message (Outside Business Hours)
    // Only apply absence message to clients. Owners and devs should not be blocked.
    if (userContext.role === 'client') {
      const hours = await store.getBusinessHours(org.id);
      const now = new Date();
      // Adjust to Angola Time (UTC+1)
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Luanda' }));
      const dayOfWeek = localTime.getDay() === 0 ? 6 : localTime.getDay() - 1; // Map Sunday=0..Saturday=6 to Monday=0..Sunday=6
      const todayHours = hours.find(h => h.day_of_week === dayOfWeek);
      
      let isClosed = true;
      if (todayHours && !todayHours.is_closed) {
        const hh = localTime.getHours().toString().padStart(2, '0');
        const mm = localTime.getMinutes().toString().padStart(2, '0');
        const hm = `${hh}:${mm}`;
        
        // Supabase time type is typically HH:MM:SS. We substring to match our HH:MM.
        const openHm = todayHours.open_time.substring(0, 5);
        const closeHm = todayHours.close_time.substring(0, 5);

        if (hm >= openHm && hm <= closeHm) {
          isClosed = false;
        }
      }

      if (isClosed) {
        const history = await store.getConversationMessages(conversationId, 5);
        
        let outOfHoursMsg = org.absence_message;
        if (!outOfHoursMsg) {
          outOfHoursMsg = 'Estamos fechados de momento, mas deixe a sua mensagem e responderemos assim que possível.';
          await store.logSetupNotification(org.id, 'Dica: Personalize a sua mensagem de ausência para um toque mais humano.');
        }

        // Only send if we haven't sent it recently (last 2 messages)
        const sentRecently = history.slice(-2).some(m => m.role === 'assistant' && m.content === outOfHoursMsg);
        if (!sentRecently) {
          await store.saveMessage(conversationId, 'assistant', outOfHoursMsg, { org_id: org.id });
          return { text: outOfHoursMsg, toolCalls: [], tokensUsed: 0, conversationId };
        }
      }
    }

    // C) Quick Replies
    const quickReplies = await store.getQuickReplies(org.id);
    if (quickReplies && quickReplies.length > 0) {
      const txtLower = messageText.toLowerCase();
      // Match if text contains any of the exact trigger words
      const matched = quickReplies.find(qr => 
        (qr.trigger_words || []).some((word: string) => txtLower.includes(word.toLowerCase()))
      );
      if (matched) {
        await store.saveMessage(conversationId, 'assistant', matched.response, { org_id: org.id });
        return { text: matched.response, toolCalls: [], tokensUsed: 0, conversationId };
      }
    }
  }

  // --- 5. Load conversation history ---
  let history: Message[] = [];
  if (conversationId) {
    history = await store.getConversationMessages(conversationId, LIMITS.MAX_CONTEXT_MESSAGES + 5);
    // Remove the message we just saved (it will be sent as the current message)
    if (history.length > 0) {
      history = history.slice(0, -1);
    }
  }
  history = applySlidingWindow(history, LIMITS.MAX_CONTEXT_MESSAGES);

  // --- 6. Build Gemini conversation history ---
  // Gemini requires STRICTLY alternating user/model roles.
  // Filter to only user/assistant messages with actual content.
  const relevantHistory = history.filter(msg =>
    (msg.role === 'user' || msg.role === 'assistant') && msg.content?.trim()
  );

  // Build alternating history — merge consecutive same-role messages
  const geminiHistory: Content[] = [];
  for (const msg of relevantHistory) {
    const geminiRole = msg.role === 'user' ? 'user' : 'model';
    const lastEntry = geminiHistory[geminiHistory.length - 1];

    if (lastEntry && lastEntry.role === geminiRole) {
      // Merge into previous entry to maintain alternating pattern
      const prevText = (lastEntry.parts[0] as Part & { text: string }).text;
      lastEntry.parts = [{ text: prevText + '\n' + msg.content }] as Part[];
    } else {
      geminiHistory.push({
        role: geminiRole,
        parts: [{ text: msg.content }] as Part[],
      });
    }
  }

  // Ensure first message is from user (Gemini requirement)
  if (geminiHistory.length > 0 && geminiHistory[0].role !== 'user') {
    geminiHistory.shift();
  }

  console.log(`[AssistantEngine] Conversation ${conversationId}: ${history.length} raw msgs → ${geminiHistory.length} history entries`);

  // --- 7. Configure Gemini model with tools ---
  const toolDeclarations = getToolDeclarations(persona.activeTools);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: persona.systemPrompt,
    tools: toolDeclarations.length > 0 ? [{
      functionDeclarations: toolDeclarations as any,
    }] : undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  // --- 8. Start chat and send message ---
  const chat = model.startChat({
    history: geminiHistory,
  });

  // If it's a callback query, prefix the message for the AI to understand
  const actualMessage = options?.isCallbackQuery
    ? `[O utilizador clicou no botão: ${messageText}]`
    : messageText;

  let response = await chat.sendMessage(actualMessage);
  let responseText = '';
  const allToolCalls: { name: string; args: any; result: any }[] = [];
  let toolCallCount = 0;
  let collectedButtons: InlineButton[] = [];

  // --- 9. Tool call loop ---
  while (true) {
    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    const parts = candidate.content?.parts || [];
    const functionCalls: FunctionCall[] = [];
    let textParts: string[] = [];

    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
      if (part.text) {
        textParts.push(part.text);
      }
    }

    // If there are no function calls, we have the final response
    if (functionCalls.length === 0) {
      responseText = textParts.join('\n');
      break;
    }

    // Check tool call limit
    const limitCheck = checkConversationLimits(toolCallCount + functionCalls.length, 0);
    if (!limitCheck.allowed) {
      responseText = textParts.join('\n') || limitCheck.reason || 'Limite de operações atingido.';
      break;
    }

    // Execute tool calls
    const functionResponses: { functionResponse: { name: string; response: any } }[] = [];

    for (const fc of functionCalls) {
      toolCallCount++;

      if (toolCallCount > LIMITS.MAX_TOOL_CALLS_PER_MESSAGE) {
        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: { error: 'Limite de operações atingido.' },
          },
        });
        continue;
      }

      const toolResult = await executeTool(
        { name: fc.name, args: fc.args || {} },
        org,
        userContext,
        persona.activeTools,
        conversationId
      );

      allToolCalls.push({
        name: fc.name,
        args: fc.args,
        result: toolResult.result,
      });

      // Collect inline buttons from tool results
      if (toolResult.result?.inline_buttons && Array.isArray(toolResult.result.inline_buttons)) {
        collectedButtons.push(...toolResult.result.inline_buttons);
      }

      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: toolResult.result,
        },
      });

      console.log(`[AssistantEngine] Tool ${fc.name} executed (${toolCallCount}/${LIMITS.MAX_TOOL_CALLS_PER_MESSAGE})`);
    }

    // Send tool results back to Gemini
    response = await chat.sendMessage(functionResponses as any);
  }

  // --- 10. Output Policy Check ---
  const outputPolicy = checkOutputPolicy(responseText, userContext.role, org.sector);
  if (outputPolicy.filtered) {
    responseText = outputPolicy.filtered;
  }

  // --- 11. Save assistant response ---
  const tokensUsed = Math.ceil(responseText.length / 4); // rough estimate
  if (conversationId) {
    await store.saveMessage(conversationId, 'assistant', responseText, {
      tool_calls: allToolCalls.length > 0 ? allToolCalls : undefined,
      tokens_used: tokensUsed,
      org_id: org.id,
    });
  }

  return {
    text: responseText,
    toolCalls: allToolCalls,
    tokensUsed,
    conversationId,
    inlineButtons: collectedButtons.length > 0 ? collectedButtons : undefined,
  };
}

// --- Handle /start command ---
export async function handleStart(
  userContext: UserContext,
  org: Organization,
  customer: Customer | null
): Promise<string> {
  // Close any active conversation so the next message starts fresh
  if (customer) {
    await store.closeActiveConversation(org.id, customer.id, userContext.channel as 'telegram' | 'whatsapp');
  }
  return getGreeting(org, customer?.name || undefined);
}
