// ===========================================
// Metrics Types
// ===========================================

export type TrendType = 'up' | 'down' | 'stable' | 'peak';

export interface MetricData {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    trend: TrendType;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    colorClass: string;
}

export interface Transaction {
    id: string;
    company: string;
    date: string;
    amount: number;
    status: 'Settled' | 'Processing' | 'Draft';
    icon: string;
    color: string;
}
