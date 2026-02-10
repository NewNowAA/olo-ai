import { useMemo } from 'react';
import { Invoice } from '../types/invoice.types';
import { InvoiceFiltersState } from './useInvoiceFilters';

export const useChartData = (filteredInvoices: Invoice[], filters: InvoiceFiltersState) => {
    return useMemo(() => {
        const { dateRange, customStartDate, customEndDate } = filters;
        const now = new Date();

        // 1. Determine Granularity Strategy
        let strategy: 'monthly' | 'daily' | 'hourly' = 'monthly'; // default for 'year' or 'all'

        if (dateRange === '24h') {
            strategy = 'hourly';
        } else if (dateRange === '30days') {
            strategy = 'daily';
        } else if (dateRange === 'custom' && customStartDate && customEndDate) {
            const diffTime = Math.abs(customEndDate.getTime() - customStartDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            strategy = diffDays > 31 ? 'monthly' : 'daily';
        }

        // 2. Initialize Data Structure (Buckets)
        const dataMap = new Map<string, { name: string, value: 0, expense: 0, sortKey: number }>();

        if (strategy === 'hourly') {
            // Create 24 hourly buckets for the last 24h
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                d.setMinutes(0, 0, 0); // round to hour
                const key = d.toISOString(); // unique key
                const label = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                dataMap.set(key, { name: label, value: 0, expense: 0, sortKey: d.getTime() });
            }
        } else if (strategy === 'daily') {
            // Determine start/end for the loop
            let start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); // 30 days default
            let end = now;

            if (dateRange === 'custom' && customStartDate && customEndDate) {
                start = customStartDate;
                end = customEndDate;
            }

            // Loop day by day
            const current = new Date(start);
            current.setHours(0, 0, 0, 0);
            const endTimestamp = end.getTime();

            while (current.getTime() <= endTimestamp + 86400000) { // Add buffer
                const key = current.toISOString().split('T')[0];
                const label = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                dataMap.set(key, { name: label, value: 0, expense: 0, sortKey: current.getTime() });
                current.setDate(current.getDate() + 1);
                if (current.getTime() > end.getTime() && dataMap.size > 1) break; // Safety break
            }
        } else {
            // Monthly (Default / Year)
            if (dateRange === 'custom' && customStartDate && customEndDate) {
                // Custom range months
                const current = new Date(customStartDate);
                current.setDate(1); // start of month
                while (current <= customEndDate) {
                    const key = `${current.getFullYear()}-${current.getMonth()}`;
                    const label = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                    dataMap.set(key, { name: label, value: 0, expense: 0, sortKey: current.getTime() });
                    current.setMonth(current.getMonth() + 1);
                }
            } else {
                // Standard Year View (Jan - Dez)
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const currentYear = now.getFullYear();
                months.forEach((m, idx) => {
                    const d = new Date(currentYear, idx, 1);
                    const key = `${currentYear}-${idx}`;
                    dataMap.set(key, { name: m, value: 0, expense: 0, sortKey: d.getTime() });
                });
            }
        }

        // 3. Populate Data
        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date);
            let key = '';

            if (strategy === 'hourly') {
                const bucketTime = new Date(date);
                bucketTime.setMinutes(0, 0, 0);
                key = bucketTime.toISOString();
            } else if (strategy === 'daily') {
                key = date.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${date.getMonth()}`;
            }

            const entry = dataMap.get(key);
            if (entry) {
                if (inv.type === 'Receita') {
                    entry.value += inv.amount;
                } else {
                    entry.expense += inv.amount;
                }
            }
        });

        // 4. Return sorted array
        return Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);
    }, [filteredInvoices, filters]);
};
