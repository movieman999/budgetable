import { useState, useMemo } from "react";
import { Header } from "@/components/budget/Header";
import { MonthlyOverview } from "@/components/budget/MonthlyOverview";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { RecentTransactions } from "@/components/budget/RecentTransactions";
import { CloseMonthCard } from "@/components/budget/CloseMonthCard";
import { QuickAddButton } from "@/components/budget/QuickAddButton";
import { AddTransactionModal } from "@/components/budget/AddTransactionModal";
import { Transaction } from "@/lib/types";

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
  },
  {
    id: '2',
    type: 'expense',
    amount: 1450,
    category: 'housing',
    description: 'Rent Payment',
    date: new Date(2026, 0, 2),
    verified: true,
  },
  {
    id: '3',
    type: 'expense',
    amount: 89.50,
    category: 'utilities',
    description: 'Electric Bill',
    date: new Date(2026, 0, 5),
    verified: true,
  },
  {
    id: '4',
    type: 'expense',
    amount: 342.18,
    category: 'food',
    description: 'Grocery Store',
    date: new Date(2026, 0, 8),
    verified: false,
  },
  {
    id: '5',
    type: 'expense',
    amount: 65,
    category: 'transport',
    description: 'Gas Station',
    date: new Date(2026, 0, 12),
    verified: false,
  },
  {
    id: '6',
    type: 'expense',
    amount: 15.99,
    category: 'entertainment',
    description: 'Netflix',
    date: new Date(2026, 0, 15),
    verified: true,
  },
  {
    id: '7',
    type: 'expense',
    amount: 127.45,
    category: 'shopping',
    description: 'Amazon Order',
    date: new Date(2026, 0, 17),
    verified: false,
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

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const monthKey = `${currentYear}-${currentDate.getMonth()}`;

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

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

  const handleVerifyTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, verified: true } : t))
    );
  };

  const handleCloseMonth = () => {
    setClosedMonths((prev) => new Set([...prev, monthKey]));
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
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-24">
        <MonthlyOverview
          income={income}
          expenses={expenses}
          savings={savings}
          daysRemaining={daysRemaining}
        />

        <CategoryBreakdown transactions={monthTransactions} />

        <RecentTransactions
          transactions={monthTransactions}
          onVerify={handleVerifyTransaction}
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
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
};

export default Index;
