import { motion } from "framer-motion";
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, Circle, Receipt, RefreshCw, Clock, Filter, Trash2 } from "lucide-react";
import { Transaction, Category, Account } from "@/lib/types";
import { IconComponent } from "@/lib/icons";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onVerify: (id: string) => void;
  onUnverify: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export function RecentTransactions({ 
  transactions, 
  categories,
  accounts,
  onVerify, 
  onUnverify, 
  onEditTransaction,
  onDeleteTransaction,
}: RecentTransactionsProps) {
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories.find((c) => c.id === 'other') || categories[0];
  };

  const getAccountInfo = (accountId: string | undefined) => {
    if (!accountId) return null;
    return accounts.find((a) => a.id === accountId);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (accountFilter === 'all') return true;
    return t.accountId === accountFilter;
  });

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Transactions</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground/70">Tap the + button to add your first one</p>
        </div>
      </motion.div>
    );
  }

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleVerifyClick = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    // For forecasted transactions, we can't verify them directly
    if (transaction.isForecasted) return;
    
    // Get the actual transaction ID (not the forecasted one)
    const actualId = transaction.recurringParentId || transaction.id;
    
    if (transaction.verified) {
      onUnverify(actualId);
    } else {
      onVerify(actualId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId && onDeleteTransaction) {
      onDeleteTransaction(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Transactions</h3>
          <div className="flex items-center gap-2">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {filteredTransactions.filter((t) => !t.verified && !t.isForecasted).length} unverified
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {sortedTransactions.map((transaction, index) => {
            const category = getCategoryInfo(transaction.category);
            const account = getAccountInfo(transaction.accountId);
            const isExpense = transaction.type === 'expense';
            const transactionDate = new Date(transaction.date);
            transactionDate.setHours(0, 0, 0, 0);
            const isFuture = transactionDate > today;
            const canVerify = !isFuture && !transaction.isForecasted;

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                onClick={() => onEditTransaction?.(transaction)}
                className={`group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50 ${
                  isFuture || transaction.isForecasted ? 'opacity-60 border border-dashed border-border' : ''
                } ${onEditTransaction ? 'cursor-pointer' : ''}`}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: category ? `${category.color}15` : undefined }}
                >
                  <span style={{ color: category?.color }}>
                    <IconComponent name={category?.icon || 'MoreHorizontal'} className="h-4 w-4" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {transaction.description || category?.name || 'Transaction'}
                    </p>
                    {transaction.isRecurring && (
                      <RefreshCw className="h-3 w-3 flex-shrink-0 text-primary" />
                    )}
                    {(isFuture || transaction.isForecasted) && (
                      <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    )}
                    {canVerify && (
                      transaction.verified ? (
                        <button
                          onClick={(e) => handleVerifyClick(e, transaction)}
                          className="transition-opacity"
                          title="Click to unverify"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-success hover:text-success/70" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleVerifyClick(e, transaction)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          title="Click to verify"
                        >
                          <Circle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {isFuture && ' (upcoming)'}
                    </p>
                    {account && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${account.color}20`, color: account.color }}
                      >
                        {account.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {isExpense ? (
                      <ArrowDownCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 text-income" />
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        isExpense ? 'text-destructive' : 'text-income'
                      }`}
                    >
                      {isExpense ? '-' : '+'}${transaction.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {!transaction.isForecasted && onDeleteTransaction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, transaction.id)}
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
