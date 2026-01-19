import { useState, useMemo } from "react";
import { Header } from "@/components/budget/Header";
import { MonthlyOverview } from "@/components/budget/MonthlyOverview";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { RecentTransactions } from "@/components/budget/RecentTransactions";
import { CloseMonthCard } from "@/components/budget/CloseMonthCard";
import { QuickAddButton } from "@/components/budget/QuickAddButton";
import { AddTransactionModal } from "@/components/budget/AddTransactionModal";
import { StartingBalanceModal } from "@/components/budget/StartingBalanceModal";
import { Transaction, MonthSettings } from "@/lib/types";
import { generateForecastedTransactions, mergeTransactionsWithForecasted } from "@/lib/recurring";

// Demo data for initial state
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 5200,
    category: 'other',
    description: 'Monthly Salary',
    date: new Date(2026, 0, 1),
    verified: true,
    accountId: 'checking',
    isRecurring: true,
    recurringSchedule: { type: 'biweekly', startDate: new Date(2026, 0, 1) },
  },
  {
    id: '2',
    type: 'expense',
    amount: 1450,
    category: 'housing',
    description: 'Rent Payment',
    date: new Date(2026, 0, 2),
    verified: true,
    accountId: 'checking',
    isRecurring: true,
    recurringSchedule: { type: 'monthly', startDate: new Date(2026, 0, 2), dayOfMonth: 2 },
  },
  {
    id: '3',
    type: 'expense',
    amount: 89.50,
    category: 'utilities',
    description: 'Electric Bill',
    date: new Date(2026, 0, 5),
    verified: true,
    accountId: 'checking',
    isRecurring: true,
    recurringSchedule: { type: 'monthly', startDate: new Date(2026, 0, 5), dayOfMonth: 5 },
  },
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
    id: '6',
    type: 'expense',
    amount: 15.99,
    category: 'entertainment',
    description: 'Netflix',
    date: new Date(2026, 0, 15),
    verified: true,
    accountId: 'credit1',
    isRecurring: true,
    recurringSchedule: { type: 'monthly', startDate: new Date(2026, 0, 15), dayOfMonth: 15 },
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
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 19));
  const [closedMonths, setClosedMonths] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [monthSettings, setMonthSettings] = useState<Record<string, MonthSettings>>({
    '2026-0': { startingBalance: 12500, accountBalances: { checking: 8000, savings: 3500, credit1: -450, cash: 450 } }
  });

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const monthKey = `${currentYear}-${currentDate.getMonth()}`;

  const currentMonthSettings = monthSettings[monthKey] || { startingBalance: 0, accountBalances: {} };

  // Get recurring transactions and generate forecasted ones
  const recurringTransactions = useMemo(() => {
    return transactions.filter((t) => t.isRecurring && !t.isForecasted);
  }, [transactions]);

  const forecastedTransactions = useMemo(() => {
    return generateForecastedTransactions(recurringTransactions, currentDate);
  }, [recurringTransactions, currentDate]);

  const monthTransactions = useMemo(() => {
    const actualTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear() &&
             !t.isForecasted;
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
    // Don't allow editing forecasted transactions directly - edit the parent
    if (transaction.isForecasted && transaction.recurringParentId) {
      const parent = transactions.find((t) => t.id === transaction.recurringParentId);
      if (parent) {
        setEditingTransaction(parent);
        setIsAddModalOpen(true);
      }
    } else {
      setEditingTransaction(transaction);
      setIsAddModalOpen(true);
    }
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
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-24">
        <MonthlyOverview
          income={income}
          expenses={expenses}
          savings={savings}
          daysRemaining={daysRemaining}
          startingBalance={currentMonthSettings.startingBalance}
        />

        <CategoryBreakdown transactions={monthTransactions} />

        <RecentTransactions
          transactions={monthTransactions}
          onVerify={handleVerifyTransaction}
          onUnverify={handleUnverifyTransaction}
          onEditTransaction={handleEditTransaction}
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
      />

      <StartingBalanceModal
        open={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        currentSettings={currentMonthSettings}
        onSave={handleSaveMonthSettings}
        monthLabel={`${currentMonth} ${currentYear}`}
      />
    </div>
  );
};

export default Index;
