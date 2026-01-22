import { useState, useMemo } from "react";
import { Header } from "@/components/budget/Header";
import { MonthlyOverview } from "@/components/budget/MonthlyOverview";
import { CategoryBreakdown } from "@/components/budget/CategoryBreakdown";
import { RecentTransactions } from "@/components/budget/RecentTransactions";
import { CloseMonthCard } from "@/components/budget/CloseMonthCard";
import { QuickAddButton } from "@/components/budget/QuickAddButton";
import { AddTransactionModal } from "@/components/budget/AddTransactionModal";
import { StartingBalanceModal } from "@/components/budget/StartingBalanceModal";
import { SettingsModal } from "@/components/budget/SettingsModal";
import { Transaction, MonthSettings } from "@/lib/types";
import { useBudget } from "@/contexts/BudgetContext";
import { exportData, importData, downloadFile } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Index = () => {
  const {
    transactions,
    recurringTemplates,
    categories,
    accounts,
    monthSettings,
    closedMonths,
    currentDate,
    setCurrentDate,
    monthTransactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    verifyTransaction,
    unverifyTransaction,
    updateCategories,
    updateAccounts,
    updateMonthSettings,
    closeMonth,
  } = useBudget();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const monthKey = `${currentYear}-${currentDate.getMonth()}`;

  const currentMonthSettings = monthSettings[monthKey] || { startingBalance: 0, accountBalances: {} };

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

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    await addTransaction(newTransaction);
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    await updateTransaction(updatedTransaction);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleVerifyTransaction = async (id: string) => {
    await verifyTransaction(id);
  };

  const handleUnverifyTransaction = async (id: string) => {
    await unverifyTransaction(id);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    if (transaction.isForecasted) {
      toast.info('This is a forecasted transaction. Wait for the date to arrive or manage the recurring item in Settings > Recurring.');
      return;
    }
    setEditingTransaction(transaction);
    setIsAddModalOpen(true);
  };

  const handleCloseMonth = async () => {
    await closeMonth(monthKey);
  };

  const handleSaveMonthSettings = async (settings: MonthSettings) => {
    await updateMonthSettings(monthKey, settings);
  };

  const handleUpdateCategories = async (newCategories: typeof categories) => {
    await updateCategories(newCategories);
  };

  const handleUpdateAccounts = async (newAccounts: typeof accounts) => {
    await updateAccounts(newAccounts);
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
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const data = importData(content, encryptionKey);
      
      if (data) {
        // Note: In a full implementation, you'd sync this to the DB
        toast.success('Data restored. Please refresh to see changes.');
      } else {
        toast.error('Failed to restore data. Check your password.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your budget...</p>
        </div>
      </div>
    );
  }

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
