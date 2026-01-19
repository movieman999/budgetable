import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, PiggyBank, ArrowRight } from "lucide-react";

interface MonthlyOverviewProps {
  income: number;
  expenses: number;
  savings: number;
  daysRemaining: number;
}

export function MonthlyOverview({ income, expenses, savings, daysRemaining }: MonthlyOverviewProps) {
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(0) : '0';
  const isPositive = savings >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      {/* Main Savings Display */}
      <div className="mb-6 text-center">
        <p className="mb-1 text-sm font-medium text-muted-foreground">
          Monthly Savings
        </p>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className={`text-4xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}
        >
          {isPositive ? '+' : '-'}${Math.abs(savings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </motion.div>
        <p className="mt-1 text-sm text-muted-foreground">
          {savingsRate}% savings rate • {daysRemaining} days left
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-income/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-income/20">
              <TrendingUp className="h-4 w-4 text-income" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Income</p>
          <p className="text-lg font-bold text-income">
            ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-destructive/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Expenses</p>
          <p className="text-lg font-bold text-destructive">
            ${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-success/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
              <PiggyBank className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Saved</p>
          <p className={`text-lg font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            ${Math.abs(savings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
