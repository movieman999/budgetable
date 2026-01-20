import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/budget/Header";
import { MonthlyOverview } from "@/components/budget/MonthlyOverview";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { RecentTransactions } from "@/components/budget/RecentTransactions";
import { CloseMonthCard } from "@/components/budget/CloseMonthCard";
import { QuickAddButton } from "@/components/budget/QuickAddButton";
import { AddTransactionModal } from "@/components/budget/AddTransactionModal";
import { StartingBalanceModal } from "@/components/budget/StartingBalanceModal";
import { SettingsModal } from "@/components/budget/SettingsModal";
import { Transaction, MonthSettings, Category, Account, RecurringTemplate, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from "@/lib/types";
import { generateForecastedTransactions, materializePastOccurrences, mergeTransactionsWithForecasted } from "@/lib/recurring";
import { exportData, importData, downloadFile } from "@/lib/storage";
import { toast } from "sonner";

// Demo recurring templates
const DEMO_RECURRING_TEMPLATES: RecurringTemplate[] = [
  {
    id: 'rec-1',
    type: 'income',
    amount: 5200,
    category: 'other',
    description: 'Monthly Salary',
    accountId: 'checking',
    schedule: { type: 'biweekly', startDate: new Date(2026, 0, 1) },
    isActive: true,
  },
  {
    id: 'rec-2',
    type: 'expense',
    amount: 1450,
    category: 'housing',
    description: 'Rent Payment',
    accountId: 'checking',
    schedule: { type: 'monthly', startDate: new Date(2026, 0, 2), dayOfMonth: 2 },
    isActive: true,
  },
  {
    id: 'rec-3',
    type: 'expense',
    amount: 89.50,
    category: 'utilities',
    description: 'Electric Bill',
    accountId: 'checking',
    schedule: { type: 'monthly', startDate: new Date(2026, 0, 5), dayOfMonth: 5 },
    isActive: true,
  },
  {
    id: 'rec-4',
    type: 'expense',
    amount: 15.99,
    category: 'entertainment',
    description: 'Netflix',
    accountId: 'credit1',
    schedule: { type: 'monthly', startDate: new Date(2026, 0, 15), dayOfMonth: 15 },
    isActive: true,
  },
];

// Demo one-time transactions
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: '4',
    type: 'expense',
    amount: 342.18,
    category: 'food',
    description: 'Grocery Store',
    date: new Date(2026, 0, 8),
    verified: false,
    accountId: 'credit1',
  },
  {
    id: '5',
    type: 'expense',
    amount: 65,
    category: 'transport',
    description: 'Gas Station',
    date: new Date(2026, 0, 12),
    verified: false,
    accountId: 'credit1',
  },
  {
    id: '7',
    type: 'expense',
    amount: 127.45,
    category: 'shopping',
    description: 'Amazon Order',
    date: new Date(2026, 0, 17),
    verified: false,
    accountId: 'credit1',
  },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>(DEMO_RECURRING_TEMPLATES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 19));
  const [closedMonths, setClosedMonths] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [monthSettings, setMonthSettings] = useState<Record<string, MonthSettings>>({
    '2026-0': { startingBalance: 12500, accountBalances: { checking: 8000, savings: 3500, credit1: -450, cash: 450 } }
  });

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const monthKey = `${currentYear}-${currentDate.getMonth()}`;

  const currentMonthSettings = monthSettings[monthKey] || { startingBalance: 0, accountBalances: {} };

  // Materialize past recurring transactions when viewing a month
  useEffect(() => {
    const newTransactions = materializePastOccurrences(
      recurringTemplates,
      currentDate,
      transactions
    );
    if (newTransactions.length > 0) {
      setTransactions(prev => [...prev, ...newTransactions]);
    }
  }, [currentDate, recurringTemplates]);

  // Generate forecasted transactions for future dates
  const forecastedTransactions = useMemo(() => {
    return generateForecastedTransactions(recurringTemplates, currentDate, transactions);
  }, [recurringTemplates, currentDate, transactions]);

  const monthTransactions = useMemo(() => {
    const actualTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
    
    // Merge with forecasted for this month
    const forecastedForMonth = forecastedTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
    
    return mergeTransactionsWithForecasted(actualTransactions, forecastedForMonth);
  }, [transactions, currentDate, forecastedTransactions]);

  const income = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const expenses = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const savings = income - expenses;

  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(0, daysInMonth - currentDate.getDate());

  const isClosed = closedMonths.has(monthKey);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(currentYear, currentDate.getMonth() + 1, 1);
    if (nextMonth <= today) {
      setCurrentDate(nextMonth);
    }
  };

  const canGoNext = () => {
    const today = new Date();
    const nextMonth = new Date(currentYear, currentDate.getMonth() + 1, 1);
    return nextMonth <= today;
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [...prev, transaction]);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    toast.success('Transaction deleted');
  };

  const handleVerifyTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, verified: true } : t))
    );
  };

  const handleUnverifyTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, verified: false } : t))
    );
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // For forecasted transactions, don't allow editing - they need to materialize first
    if (transaction.isForecasted) {
      toast.info('This is a forecasted transaction. Wait for the date to arrive or manage the recurring item in Settings > Recurring.');
      return;
    }
    setEditingTransaction(transaction);
    setIsAddModalOpen(true);
  };

  const handleCloseMonth = () => {
    setClosedMonths((prev) => new Set([...prev, monthKey]));
  };

  const handleSaveMonthSettings = (settings: MonthSettings) => {
    setMonthSettings((prev) => ({
      ...prev,
      [monthKey]: settings,
    }));
  };

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    toast.success('Categories updated');
  };

  const handleUpdateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    toast.success('Accounts updated');
  };

  const handleBackup = (encryptionKey: string) => {
    const encrypted = exportData(
      transactions,
      categories,
      accounts,
      monthSettings,
      Array.from(closedMonths),
      encryptionKey,
      recurringTemplates
    );
    const filename = `budget-backup-${new Date().toISOString().split('T')[0]}.budgetbackup`;
    downloadFile(encrypted, filename);
    toast.success('Backup downloaded successfully');
  };

  const handleRestore = (file: File, encryptionKey: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = importData(content, encryptionKey);
      
      if (data) {
        setTransactions(data.transactions);
        setCategories(data.categories);
        setAccounts(data.accounts);
        setMonthSettings(data.monthSettings);
        setClosedMonths(new Set(data.closedMonths));
        if (data.recurringTemplates) {
          setRecurringTemplates(data.recurringTemplates);
        }
        toast.success('Data restored successfully');
      } else {
        toast.error('Failed to restore data. Check your password.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        canGoNext={canGoNext()}
        isClosed={isClosed}
        onCloseMonth={handleCloseMonth}
        onOpenBalanceSettings={() => setIsBalanceModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-24">
        <MonthlyOverview
          income={income}
          expenses={expenses}
          savings={savings}
          daysRemaining={daysRemaining}
          startingBalance={currentMonthSettings.startingBalance}
        />

        <CategoryBreakdown transactions={monthTransactions} categories={categories} />

        <RecentTransactions
          transactions={monthTransactions}
          categories={categories}
          accounts={accounts}
          onVerify={handleVerifyTransaction}
          onUnverify={handleUnverifyTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />

        <CloseMonthCard
          transactions={monthTransactions}
          onCloseMonth={handleCloseMonth}
          isClosed={isClosed}
        />
      </main>

      {!isClosed && <QuickAddButton onClick={() => setIsAddModalOpen(true)} />}

      <AddTransactionModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onAdd={handleAddTransaction}
        editingTransaction={editingTransaction}
        onUpdate={handleUpdateTransaction}
        categories={categories}
        accounts={accounts}
      />

      <StartingBalanceModal
        open={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        currentSettings={currentMonthSettings}
        onSave={handleSaveMonthSettings}
        monthLabel={`${currentMonth} ${currentYear}`}
        accounts={accounts}
      />

      <SettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        categories={categories}
        accounts={accounts}
        onUpdateCategories={handleUpdateCategories}
        onUpdateAccounts={handleUpdateAccounts}
        onBackup={handleBackup}
        onRestore={handleRestore}
      />
    </div>
  );
};

export default Index;
