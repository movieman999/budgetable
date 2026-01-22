import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Transaction, 
  Category, 
  Account, 
  RecurringTemplate, 
  MonthSettings, 
  DEFAULT_CATEGORIES, 
  DEFAULT_ACCOUNTS 
} from '@/lib/types';
import { generateForecastedTransactions, materializePastOccurrences, mergeTransactionsWithForecasted } from '@/lib/recurring';

interface BudgetContextType {
  // Data
  transactions: Transaction[];
  recurringTemplates: RecurringTemplate[];
  categories: Category[];
  accounts: Account[];
  monthSettings: Record<string, MonthSettings>;
  closedMonths: Set<string>;
  
  // Current view
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  
  // Computed
  monthTransactions: Transaction[];
  forecastedTransactions: Transaction[];
  
  // Loading state
  loading: boolean;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  verifyTransaction: (id: string) => Promise<void>;
  unverifyTransaction: (id: string) => Promise<void>;
  
  // Recurring actions
  addRecurringTemplate: (template: Omit<RecurringTemplate, 'id'>) => Promise<void>;
  updateRecurringTemplate: (template: RecurringTemplate) => Promise<void>;
  deleteRecurringTemplate: (id: string) => Promise<void>;
  toggleRecurringActive: (id: string) => Promise<void>;
  
  // Settings actions
  updateCategories: (categories: Category[]) => Promise<void>;
  updateAccounts: (accounts: Account[]) => Promise<void>;
  updateMonthSettings: (key: string, settings: MonthSettings) => Promise<void>;
  closeMonth: (key: string) => Promise<void>;
  
  // Refresh
  refreshData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Core state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [monthSettings, setMonthSettings] = useState<Record<string, MonthSettings>>({});
  const [closedMonths, setClosedMonths] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Category/account ID maps for DB lookups
  const [categoryIdMap, setCategoryIdMap] = useState<Record<string, string>>({});
  const [accountIdMap, setAccountIdMap] = useState<Record<string, string>>({});

  // Load data from database
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load categories
      const { data: dbCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (dbCategories && dbCategories.length > 0) {
        const cats: Category[] = dbCategories.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
        }));
        setCategories(cats);
        
        const idMap: Record<string, string> = {};
        dbCategories.forEach(c => { idMap[c.id] = c.id; });
        setCategoryIdMap(idMap);
      } else {
        // Initialize default categories for new user
        const insertCategories = DEFAULT_CATEGORIES.map(c => ({
          user_id: user.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
        }));
        
        const { data: newCats } = await supabase
          .from('categories')
          .insert(insertCategories)
          .select();
        
        if (newCats) {
          const cats: Category[] = newCats.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
          }));
          setCategories(cats);
          
          const idMap: Record<string, string> = {};
          newCats.forEach((c, i) => { idMap[DEFAULT_CATEGORIES[i].id] = c.id; });
          setCategoryIdMap(idMap);
        }
      }

      // Load accounts
      const { data: dbAccounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (dbAccounts && dbAccounts.length > 0) {
        const accs: Account[] = dbAccounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type as Account['type'],
          color: a.color,
        }));
        setAccounts(accs);
        
        const idMap: Record<string, string> = {};
        dbAccounts.forEach(a => { idMap[a.id] = a.id; });
        setAccountIdMap(idMap);
      } else {
        // Initialize default accounts for new user
        const insertAccounts = DEFAULT_ACCOUNTS.map(a => ({
          user_id: user.id,
          name: a.name,
          type: a.type,
          color: a.color,
        }));
        
        const { data: newAccs } = await supabase
          .from('accounts')
          .insert(insertAccounts)
          .select();
        
        if (newAccs) {
          const accs: Account[] = newAccs.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type as Account['type'],
            color: a.color,
          }));
          setAccounts(accs);
          
          const idMap: Record<string, string> = {};
          newAccs.forEach((a, i) => { idMap[DEFAULT_ACCOUNTS[i].id] = a.id; });
          setAccountIdMap(idMap);
        }
      }

      // Load recurring templates
      const { data: dbTemplates } = await supabase
        .from('recurring_templates')
        .select('*')
        .eq('user_id', user.id);

      if (dbTemplates) {
        const templates: RecurringTemplate[] = dbTemplates.map(t => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          category: t.category_id || 'other',
          description: t.description || '',
          accountId: t.account_id || undefined,
          schedule: {
            type: t.schedule_type as RecurringTemplate['schedule']['type'],
            startDate: new Date(t.schedule_start_date),
            endDate: t.schedule_end_date ? new Date(t.schedule_end_date) : undefined,
            dayOfMonth: t.schedule_day_of_month || undefined,
            customDays: t.schedule_custom_days || undefined,
          },
          isActive: t.is_active,
        }));
        setRecurringTemplates(templates);
      }

      // Load transactions
      const { data: dbTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (dbTransactions) {
        const txs: Transaction[] = dbTransactions.map(t => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          category: t.category_id || 'other',
          description: t.description || '',
          date: new Date(t.date),
          verified: t.verified,
          accountId: t.account_id || undefined,
          wasAutoGenerated: t.was_auto_generated,
          recurringParentId: t.recurring_template_id || undefined,
        }));
        setTransactions(txs);
      }

      // Load month settings
      const { data: dbSettings } = await supabase
        .from('month_settings')
        .select('*')
        .eq('user_id', user.id);

      if (dbSettings) {
        const settings: Record<string, MonthSettings> = {};
        const closed = new Set<string>();
        
        dbSettings.forEach(s => {
          settings[s.month_key] = {
            startingBalance: Number(s.starting_balance),
            accountBalances: (s.account_balances as Record<string, number>) || {},
          };
          if (s.is_closed) {
            closed.add(s.month_key);
          }
        });
        
        setMonthSettings(settings);
        setClosedMonths(closed);
      }

    } catch (error) {
      console.error('Failed to load budget data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Materialize past recurring occurrences
  useEffect(() => {
    if (!user || loading) return;
    
    const newTransactions = materializePastOccurrences(
      recurringTemplates,
      currentDate,
      transactions
    );
    
    if (newTransactions.length > 0) {
      // Save materialized transactions to DB
      const saveMaterialized = async () => {
        for (const tx of newTransactions) {
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: tx.type,
            amount: tx.amount,
            category_id: tx.category,
            description: tx.description,
            date: tx.date.toISOString().split('T')[0],
            verified: false,
            account_id: tx.accountId || null,
            recurring_template_id: tx.recurringTemplateId || null,
            was_auto_generated: true,
          });
        }
      };
      saveMaterialized();
      setTransactions(prev => [...prev, ...newTransactions]);
    }
  }, [currentDate, recurringTemplates, transactions, user, loading]);

  // Generate forecasted transactions
  const forecastedTransactions = useMemo(() => {
    return generateForecastedTransactions(recurringTemplates, currentDate, transactions);
  }, [recurringTemplates, currentDate, transactions]);

  // Get transactions for current month
  const monthTransactions = useMemo(() => {
    const actualTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
    
    const forecastedForMonth = forecastedTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
    
    return mergeTransactionsWithForecasted(actualTransactions, forecastedForMonth);
  }, [transactions, currentDate, forecastedTransactions]);

  // Transaction actions
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.category,
      description: transaction.description,
      date: transaction.date instanceof Date 
        ? transaction.date.toISOString().split('T')[0] 
        : transaction.date,
      verified: transaction.verified || false,
      account_id: transaction.accountId || null,
      was_auto_generated: false,
    }).select().single();
    
    if (error) {
      toast.error('Failed to add transaction');
      return;
    }
    
    if (data) {
      const newTx: Transaction = {
        id: data.id,
        type: data.type as 'income' | 'expense',
        amount: Number(data.amount),
        category: data.category_id || 'other',
        description: data.description || '',
        date: new Date(data.date),
        verified: data.verified,
        accountId: data.account_id || undefined,
      };
      setTransactions(prev => [...prev, newTx]);
      toast.success('Transaction added');
    }
  }, [user]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    if (!user) return;
    
    const { error } = await supabase.from('transactions').update({
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.category,
      description: transaction.description,
      date: transaction.date instanceof Date 
        ? transaction.date.toISOString().split('T')[0] 
        : transaction.date,
      verified: transaction.verified,
      account_id: transaction.accountId || null,
    }).eq('id', transaction.id);
    
    if (error) {
      toast.error('Failed to update transaction');
      return;
    }
    
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    toast.success('Transaction updated');
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete transaction');
      return;
    }
    
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transaction deleted');
  }, [user]);

  const verifyTransaction = useCallback(async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('transactions').update({ verified: true }).eq('id', id);
    
    if (error) {
      toast.error('Failed to verify transaction');
      return;
    }
    
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, verified: true } : t));
  }, [user]);

  const unverifyTransaction = useCallback(async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('transactions').update({ verified: false }).eq('id', id);
    
    if (error) {
      toast.error('Failed to unverify transaction');
      return;
    }
    
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, verified: false } : t));
  }, [user]);

  // Recurring template actions
  const addRecurringTemplate = useCallback(async (template: Omit<RecurringTemplate, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('recurring_templates').insert({
      user_id: user.id,
      type: template.type,
      amount: template.amount,
      category_id: template.category,
      description: template.description,
      account_id: template.accountId || null,
      schedule_type: template.schedule.type,
      schedule_start_date: template.schedule.startDate instanceof Date
        ? template.schedule.startDate.toISOString().split('T')[0]
        : template.schedule.startDate,
      schedule_end_date: template.schedule.endDate 
        ? (template.schedule.endDate instanceof Date 
            ? template.schedule.endDate.toISOString().split('T')[0] 
            : template.schedule.endDate)
        : null,
      schedule_day_of_month: template.schedule.dayOfMonth || null,
      schedule_custom_days: template.schedule.customDays || null,
      is_active: template.isActive,
    }).select().single();
    
    if (error) {
      toast.error('Failed to add recurring item');
      return;
    }
    
    if (data) {
      const newTemplate: RecurringTemplate = {
        id: data.id,
        type: data.type as 'income' | 'expense',
        amount: Number(data.amount),
        category: data.category_id || 'other',
        description: data.description || '',
        accountId: data.account_id || undefined,
        schedule: {
          type: data.schedule_type as RecurringTemplate['schedule']['type'],
          startDate: new Date(data.schedule_start_date),
          endDate: data.schedule_end_date ? new Date(data.schedule_end_date) : undefined,
          dayOfMonth: data.schedule_day_of_month || undefined,
          customDays: data.schedule_custom_days || undefined,
        },
        isActive: data.is_active,
      };
      setRecurringTemplates(prev => [...prev, newTemplate]);
      toast.success('Recurring item added');
    }
  }, [user]);

  const updateRecurringTemplate = useCallback(async (template: RecurringTemplate) => {
    if (!user) return;
    
    const { error } = await supabase.from('recurring_templates').update({
      type: template.type,
      amount: template.amount,
      category_id: template.category,
      description: template.description,
      account_id: template.accountId || null,
      schedule_type: template.schedule.type,
      schedule_start_date: template.schedule.startDate instanceof Date
        ? template.schedule.startDate.toISOString().split('T')[0]
        : template.schedule.startDate,
      schedule_end_date: template.schedule.endDate 
        ? (template.schedule.endDate instanceof Date 
            ? template.schedule.endDate.toISOString().split('T')[0] 
            : template.schedule.endDate)
        : null,
      schedule_day_of_month: template.schedule.dayOfMonth || null,
      schedule_custom_days: template.schedule.customDays || null,
      is_active: template.isActive,
    }).eq('id', template.id);
    
    if (error) {
      toast.error('Failed to update recurring item');
      return;
    }
    
    setRecurringTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    toast.success('Recurring item updated');
  }, [user]);

  const deleteRecurringTemplate = useCallback(async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('recurring_templates').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete recurring item');
      return;
    }
    
    setRecurringTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Recurring item deleted');
  }, [user]);

  const toggleRecurringActive = useCallback(async (id: string) => {
    if (!user) return;
    
    const template = recurringTemplates.find(t => t.id === id);
    if (!template) return;
    
    const { error } = await supabase.from('recurring_templates')
      .update({ is_active: !template.isActive })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to toggle recurring item');
      return;
    }
    
    setRecurringTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
    toast.success(template.isActive ? 'Recurring item paused' : 'Recurring item resumed');
  }, [user, recurringTemplates]);

  // Settings actions
  const updateCategories = useCallback(async (newCategories: Category[]) => {
    if (!user) return;
    
    // For simplicity, delete and re-insert (in production, do proper upsert)
    await supabase.from('categories').delete().eq('user_id', user.id);
    
    const inserts = newCategories.map(c => ({
      id: c.id.startsWith('custom-') ? undefined : c.id,
      user_id: user.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
    }));
    
    const { data } = await supabase.from('categories').insert(inserts).select();
    
    if (data) {
      const cats: Category[] = data.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
      }));
      setCategories(cats);
    }
    toast.success('Categories updated');
  }, [user]);

  const updateAccounts = useCallback(async (newAccounts: Account[]) => {
    if (!user) return;
    
    await supabase.from('accounts').delete().eq('user_id', user.id);
    
    const inserts = newAccounts.map(a => ({
      id: a.id.startsWith('account-') ? undefined : a.id,
      user_id: user.id,
      name: a.name,
      type: a.type,
      color: a.color,
    }));
    
    const { data } = await supabase.from('accounts').insert(inserts).select();
    
    if (data) {
      const accs: Account[] = data.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type as Account['type'],
        color: a.color,
      }));
      setAccounts(accs);
    }
    toast.success('Accounts updated');
  }, [user]);

  const updateMonthSettings = useCallback(async (key: string, settings: MonthSettings) => {
    if (!user) return;
    
    const { error } = await supabase.from('month_settings').upsert({
      user_id: user.id,
      month_key: key,
      starting_balance: settings.startingBalance,
      account_balances: settings.accountBalances,
    }, { onConflict: 'user_id,month_key' });
    
    if (error) {
      toast.error('Failed to save month settings');
      return;
    }
    
    setMonthSettings(prev => ({ ...prev, [key]: settings }));
    toast.success('Month settings saved');
  }, [user]);

  const closeMonth = useCallback(async (key: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('month_settings').upsert({
      user_id: user.id,
      month_key: key,
      is_closed: true,
      starting_balance: monthSettings[key]?.startingBalance || 0,
      account_balances: monthSettings[key]?.accountBalances || {},
    }, { onConflict: 'user_id,month_key' });
    
    if (error) {
      toast.error('Failed to close month');
      return;
    }
    
    setClosedMonths(prev => new Set([...prev, key]));
    toast.success('Month closed');
  }, [user, monthSettings]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const value: BudgetContextType = {
    transactions,
    recurringTemplates,
    categories,
    accounts,
    monthSettings,
    closedMonths,
    currentDate,
    setCurrentDate,
    monthTransactions,
    forecastedTransactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    verifyTransaction,
    unverifyTransaction,
    addRecurringTemplate,
    updateRecurringTemplate,
    deleteRecurringTemplate,
    toggleRecurringActive,
    updateCategories,
    updateAccounts,
    updateMonthSettings,
    closeMonth,
    refreshData,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
