// ===========================================
// Formatters - Utility functions for formatting
// ===========================================

/**
 * Format a number as currency (Euro)
 */
export function formatCurrency(
    value: number,
    locale: string = 'pt-PT',
    currency: string = 'EUR'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date string
 */
export function formatDate(
    date: string | Date,
    locale: string = 'pt-PT'
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format time (HH:mm)
 */
export function formatTime(date: Date = new Date()): string {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Abbreviate large numbers (e.g., 1.5K, 2.3M)
 */
export function abbreviateNumber(value: number): string {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);

    if (tier === 0) return value.toString();

    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = value / scale;

    return scaled.toFixed(1).replace(/\.0$/, '') + suffix;
}
