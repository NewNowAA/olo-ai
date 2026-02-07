export interface NavItem {
  icon: any; // Using 'any' for Lucide icons to avoid complex type imports in this simple setup
  label: string;
  active?: boolean;
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

export interface MetricData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  trend: 'up' | 'down' | 'stable' | 'peak';
  icon: any;
  colorClass: string;
}