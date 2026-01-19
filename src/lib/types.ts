export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: Date;
  verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

export interface MonthlyData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  isClosed: boolean;
  transactions: Transaction[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing', icon: 'Home', color: 'hsl(175 60% 35%)' },
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'hsl(38 92% 50%)' },
  { id: 'transport', name: 'Transportation', icon: 'Car', color: 'hsl(200 85% 45%)' },
  { id: 'utilities', name: 'Utilities', icon: 'Zap', color: 'hsl(280 60% 50%)' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: 'hsl(340 75% 55%)' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'hsl(160 65% 40%)' },
  { id: 'health', name: 'Health', icon: 'Heart', color: 'hsl(0 70% 55%)' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: 'hsl(220 10% 50%)' },
];
