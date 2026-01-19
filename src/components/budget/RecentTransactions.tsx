import { motion } from "framer-motion";
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, Circle, Receipt } from "lucide-react";
import { Transaction, DEFAULT_CATEGORIES } from "@/lib/types";
import { IconComponent } from "@/lib/icons";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onVerify: (id: string) => void;
}

export function RecentTransactions({ transactions, onVerify }: RecentTransactionsProps) {
  const getCategoryInfo = (categoryId: string) => {
    return DEFAULT_CATEGORIES.find((c) => c.id === categoryId) || DEFAULT_CATEGORIES[7];
  };

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

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        <span className="text-xs text-muted-foreground">
          {transactions.filter((t) => !t.verified).length} unverified
        </span>
      </div>

      <div className="space-y-3">
        {sortedTransactions.map((transaction, index) => {
          const category = getCategoryInfo(transaction.category);
          const isExpense = transaction.type === 'expense';

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.03 }}
              className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <span style={{ color: category.color }}>
                  <IconComponent name={category.icon} className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {transaction.description || category.name}
                  </p>
                  {transaction.verified ? (
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-success" />
                  ) : (
                    <button
                      onClick={() => onVerify(transaction.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Circle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

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
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
