import { useState, useMemo } from 'react';
import { Invoice, InvoiceType } from '../types/invoice.types';

export type DateRangeType = '24h' | '30days' | 'year' | 'all' | 'custom';

export interface InvoiceFiltersState {
    dateRange: DateRangeType;
    customStartDate: Date | null;
    customEndDate: Date | null;
    filterType: string; // 'Todos', 'Receita', 'Despesa'
    searchText: string;
    subcategoryFilter: string;
    sortField: keyof Invoice;
    sortOrder: 'asc' | 'desc';
}

export const useInvoiceFilters = (invoices: Invoice[]) => {
    const [filters, setFilters] = useState<InvoiceFiltersState>({
        dateRange: 'all',
        customStartDate: null,
        customEndDate: null,
        filterType: 'Todos',
        searchText: '',
        subcategoryFilter: '',
        sortField: 'date',
        sortOrder: 'desc'
    });

    const setFilter = (key: keyof InvoiceFiltersState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredInvoices = useMemo(() => {
        let result = [...invoices];

        // 1. Filter by Type
        if (filters.filterType !== 'Todos') {
            result = result.filter(inv => inv.type === filters.filterType);
        }

        // 2. Filter by Search Text
        if (filters.searchText) {
            const search = filters.searchText.toLowerCase();
            result = result.filter(inv =>
                inv.client.toLowerCase().includes(search) ||
                inv.invoiceNumber?.toLowerCase().includes(search) ||
                inv.id.toLowerCase().includes(search)
            );
        }

        // 3. Filter by Subcategory
        if (filters.subcategoryFilter) {
            result = result.filter(inv =>
                inv.subcategory?.toLowerCase().includes(filters.subcategoryFilter.toLowerCase())
            );
        }

        // 4. Filter by Date Range (using issue date for financial accuracy)
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        if (filters.dateRange === '24h') {
            start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (filters.dateRange === '30days') {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (filters.dateRange === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
        } else if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
            start = filters.customStartDate;
            end = new Date(filters.customEndDate);
            end.setHours(23, 59, 59, 999);
        }

        if (start) {
            result = result.filter(inv => {
                // Use Created At (Upload Date) as primary filter source for operational visibility
                // Fallback to Issue Date only if created_at is missing (legacy data)
                const dateStr = inv.created_at || inv.date || new Date().toISOString();
                const filterDate = new Date(dateStr);

                if (end) {
                    return filterDate >= start! && filterDate <= end;
                }
                return filterDate >= start!;
            });
        }

        // 5. Sorting
        result.sort((a, b) => {
            let valA = a[filters.sortField];
            let valB = b[filters.sortField];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return filters.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return filters.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [invoices, filters]);

    const stats = useMemo(() => {
        const totalRevenue = filteredInvoices
            .filter(inv => inv.type === 'Receita')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const totalExpenses = filteredInvoices
            .filter(inv => inv.type === 'Despesa')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        const pendingAmount = filteredInvoices
            .filter(inv => inv.status === 'Pendente')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const profit = totalRevenue - totalExpenses;
        const totalTransactions = filteredInvoices.length;
        const averageTicket = totalTransactions > 0 ? (totalRevenue + totalExpenses) / totalTransactions : 0;

        // Calculate IVA (dummy for now or based on items if available)
        const totalIVA = filteredInvoices.reduce((sum, inv) => {
            const itemsIVA = inv.items?.reduce((s, item) => s + (item.vat || 0), 0) || 0;
            return sum + itemsIVA;
        }, 0);

        return { totalRevenue, totalExpenses, pendingAmount, profit, totalTransactions, averageTicket, totalIVA };
    }, [filteredInvoices]);

    return {
        filters,
        setFilter,
        filteredInvoices,
        stats
    };
};
