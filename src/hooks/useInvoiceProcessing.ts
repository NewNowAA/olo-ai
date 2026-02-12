import { useState, useEffect } from 'react';
import { supabase } from '@/src/services';
import { Invoice } from '../types/invoice.types';

export const useInvoiceProcessing = (invoiceId: string | null) => {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [status, setStatus] = useState<string>('idle');
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!invoiceId) return;

        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (error) {
                console.error('Error polling invoice:', error);
                return;
            }

            if (data) {
                setInvoice(data as any); // Type assertion needed for now
                setStatus(data.processing_status || 'idle');

                if (['needs_review', 'completed', 'failed'].includes(data.processing_status)) {
                    setIsPolling(false);
                    clearInterval(intervalId);
                }
            }
        };

        setIsPolling(true);
        // Initial check
        checkStatus();
        // Poll every 2 seconds
        intervalId = setInterval(checkStatus, 2000);

        return () => clearInterval(intervalId);
    }, [invoiceId]);

    return { invoice, status, isPolling };
};
