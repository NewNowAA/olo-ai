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

export interface InvoiceItem {
  name: string;
  description: string;
  quantity: number;
  price: number;
  vat: number;
}

export type InvoiceType = 'Receita' | 'Despesa';
export type InvoiceStatus = 'Pago' | 'Pendente' | 'Atrasado';

export interface Invoice {
  id: string;
  client: string;
  type: InvoiceType;
  amount: number;
  status: InvoiceStatus;
  date: string;
  category: string;
  subcategory?: string; // New field
  items?: InvoiceItem[];
  thumbnail?: string; 
}