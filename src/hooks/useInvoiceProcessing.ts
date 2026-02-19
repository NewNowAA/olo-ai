import { useState, useEffect } from 'react';
import { supabase } from '../services';
import { Invoice } from '../types/invoice.types';

export const useInvoiceProcessing = (invoiceId: string | null) => {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [status, setStatus] = useState<string>('idle');
    const [isPolling, setIsPolling] = useState(false); // Kept for API compatibility, essentially "isListening"

    // 3. Polling Fallback (Safety net if Realtime fails)
    useEffect(() => {
        if (!invoiceId || !isPolling) return;

        const pollInterval = setInterval(async () => {
            // console.log('[DEBUG] Polling tick... ID:', invoiceId);
            try {
                // Use the service which now maps items correctly!
                const { invoiceService } = await import('../services/invoice/invoiceService');
                const data = await invoiceService.getInvoiceById(invoiceId);

                if (data) {
                    const newStatus = data.processing_status || 'idle';

                    // Only update if changed or critical status
                    if (['completed', 'needs_review', 'failed'].includes(newStatus)) {
                        setInvoice(data);
                        setStatus(newStatus);
                        setIsPolling(false); // Stop polling
                    } else if (newStatus !== status) {
                        setStatus(newStatus);
                    }
                }
            } catch (err) {
                console.warn("Polling error:", err);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [invoiceId, isPolling, status]);

    useEffect(() => {
        if (!invoiceId) {
            setInvoice(null);
            setStatus('idle');
            setIsPolling(false);
            return;
        }

        setIsPolling(true);

        // 1. Initial Fetch
        const fetchInitial = async () => {
            try {
                // Use the service which now maps items correctly!
                const { invoiceService } = await import('../services/invoice/invoiceService');
                const data = await invoiceService.getInvoiceById(invoiceId);

                if (data) {
                    setInvoice(data);
                    setStatus(data.processing_status || 'idle');

                    // If already done, we technically don't need real-time, but keeping it ensures we catch last-second updates
                    if (['completed', 'failed', 'needs_review'].includes(data.processing_status || '')) {
                        setIsPolling(false);
                    }
                }
            } catch (err) {
                console.error('Error fetching initial invoice:', err);
            }
        };

        fetchInitial();

        // 2. Realtime Subscription (The "No Stutter" Solution)
        const channel = supabase
            .channel(`invoice-${invoiceId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'invoices',
                    filter: `id=eq.${invoiceId}`
                },
                async (payload) => {
                    const newStatus = payload.new.processing_status;

                    if (['completed', 'needs_review'].includes(newStatus)) {
                        // Re-fetch full object including items (Realtime payload doesn't include relations)
                        const { invoiceService } = await import('../services/invoice/invoiceService');
                        const fullInvoice = await invoiceService.getInvoiceById(invoiceId);

                        // Update both atomically-ish (React batching) to ensure consistent state
                        setInvoice(fullInvoice);
                        setStatus(newStatus);
                        setIsPolling(false);
                    } else if (newStatus === 'failed') {
                        setStatus(newStatus);
                        setIsPolling(false);
                    } else {
                        // For intermediate states like 'processing', update immediately
                        setStatus(newStatus);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [invoiceId]);

    return { invoice, status, isPolling };
};
