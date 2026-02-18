/**
 * Utility functions for Angolan Tax Authority (AGT) compliance.
 */

/**
 * Validates a NIF (Número de Identificação Fiscal).
 * Supports strict format validation for Angolan entities.
 * Format: 10 digits (Group 1: 541/542 for companies, etc - specialized logic can be added)
 * or 999999999 for final consumer.
 * 
 * @param nif The NIF string to validate.
 * @returns true if valid, false otherwise.
 */
export const validateNIF = (nif: string): boolean => {
    // Basic cleaning
    const cleanNif = nif.replace(/[^a-zA-Z0-9]/g, '');

    // Length check (Angolan NIF is typically 10 digits/chars)
    if (cleanNif.length !== 10 && cleanNif !== '999999999') {
        return false;
    }

    // "Consumidor Final" generic NIF
    if (cleanNif === '999999999') return true;

    // TODO: Implement specific check-digit logic if available for Angolan NIFs.
    // For now, ensure it is not all zeros.
    if (/^0+$/.test(cleanNif)) return false;

    return true;
};

/**
 * Generates a mock hash for the invoice, simulating AGT requirements (RSA-SHA1).
 * In a real scenario, this MUST be done on the server with a secure Private Key.
 * 
 * Data to sign usually includes:
 * - Invoice Date
 * - Invoice System Entry Date
 * - Invoice Number
 * - Gross Total
 * - Previous Invoice Hash
 * 
 * @param invoiceData Object containing invoice details.
 * @returns A 4-character hash segment (typical display format) or full hash string.
 */
export const generateInvoiceHash = async (invoiceData: {
    date: string;
    systemEntryDate: string;
    invoiceNo: string;
    grossTotal: number;
    previousHash?: string;
}): Promise<string> => {
    const dataString = `${invoiceData.date};${invoiceData.systemEntryDate};${invoiceData.invoiceNo};${invoiceData.grossTotal.toFixed(2)};${invoiceData.previousHash || ''}`;
    
    // Simulate SHA1 (using Web Crypto API for consistency, though implementation creates a SHA-256 for demo)
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return a format similar to AGT short hash (Base64 is typical, here we perform a mock signature)
    return btoa(hashHex).substring(0, 172); // Mocking the length of a signature
};

/**
 * Detects anomalies in invoice data.
 * @param invoice Invoice object
 * @returns Array of warning strings.
 */
export const detectAnomalies = (invoice: any): string[] => {
    const warnings: string[] = [];

    // Check for future dates
    if (new Date(invoice.date) > new Date()) {
        warnings.push("Data da fatura está no futuro.");
    }

    // Check for high value without client details
    if (invoice.amount > 100000 && (!invoice.client || invoice.client.toLowerCase().includes('consumidor'))) {
        warnings.push("Fatura de alto valor para Consumidor Final/Cliente Genérico.");
    }

    return warnings;
};
