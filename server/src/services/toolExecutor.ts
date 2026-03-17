// =============================================
// Olo.AI — Tool Executor (Dispatcher)
// =============================================

import { Organization, UserContext } from '../types/index.js';
import { checkToolPolicy } from '../services/policyGuard.js';
import * as catalogTools from '../tools/catalog.js';
import * as stockTools from '../tools/stock.js';
import * as appointmentTools from '../tools/appointments.js';
import * as orderTools from '../tools/orders.js';
import * as businessTools from '../tools/business.js';
import * as handoffTools from '../tools/handoff.js';
import * as complaintTools from '../tools/complaints.js';

export interface ToolCallInput {
  name: string;
  args: Record<string, any>;
}

export interface ToolCallOutput {
  name: string;
  result: Record<string, any>;
  error?: string;
}

export async function executeTool(
  call: ToolCallInput,
  org: Organization,
  userContext: UserContext,
  allowedTools: string[],
  conversationId?: string
): Promise<ToolCallOutput> {
  // Policy check
  const policy = checkToolPolicy(call.name, userContext.role, allowedTools);
  if (!policy.allowed) {
    return {
      name: call.name,
      result: { success: false, message: policy.reason },
      error: policy.reason,
    };
  }

  const orgId = org.id;
  const customerId = userContext.customerId;

  try {
    let result: Record<string, any>;

    switch (call.name) {
      // --- Catalog ---
      case 'search_catalog':
        result = await catalogTools.search_catalog(orgId, call.args);
        break;
      case 'get_product_details':
        result = await catalogTools.get_product_details(orgId, call.args as any);
        break;
      case 'list_categories':
        result = await catalogTools.list_categories(orgId);
        break;

      // --- Stock ---
      case 'check_stock':
        result = await stockTools.check_stock(orgId, call.args as any);
        break;
      case 'update_stock':
        result = await stockTools.update_stock(orgId, call.args as any);
        break;
      case 'stock_alerts':
        result = await stockTools.stock_alerts(orgId);
        break;

      // --- Appointments ---
      case 'check_availability':
        result = await appointmentTools.check_availability(orgId, call.args as any);
        break;
      case 'create_appointment':
        result = await appointmentTools.create_appointment(orgId, call.args as any, customerId);
        break;
      case 'cancel_appointment':
        result = await appointmentTools.cancel_appointment(orgId, call.args as any, customerId);
        break;
      case 'list_appointments':
        result = await appointmentTools.list_appointments(orgId, call.args as any, customerId);
        break;

      // --- Orders ---
      case 'create_order':
        result = await orderTools.create_order(orgId, call.args as any, customerId, conversationId);
        break;

      // --- Business Info ---
      case 'get_business_info':
        result = await businessTools.get_business_info(orgId, call.args as any, org);
        break;

      // --- Handoff ---
      case 'transfer_to_human':
        result = await handoffTools.transfer_to_human(orgId, call.args as any, customerId, conversationId);
        break;
      case 'save_customer_info':
        result = await handoffTools.save_customer_info(orgId, call.args as any, customerId);
        break;

      // --- Complaints ---
      case 'file_complaint':
        result = await complaintTools.file_complaint(orgId, call.args as any, customerId, conversationId);
        break;

      default:
        result = { success: false, message: `Tool desconhecida: ${call.name}` };
    }

    console.log(`[ToolExecutor] ${call.name} →`, JSON.stringify(result).substring(0, 200));
    return { name: call.name, result };

  } catch (error: any) {
    console.error(`[ToolExecutor] Error executing ${call.name}:`, error);
    return {
      name: call.name,
      result: { success: false, message: `Erro ao executar ${call.name}: ${error.message}` },
      error: error.message,
    };
  }
}
