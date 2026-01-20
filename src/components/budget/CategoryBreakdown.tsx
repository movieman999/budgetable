import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Category, Transaction } from "@/lib/types";
import { IconComponent } from "@/lib/icons";

interface CategoryBreakdownProps {
  transactions: Transaction[];
  categories: Category[];
}

export function CategoryBreakdown({ transactions, categories }: CategoryBreakdownProps) {
  const expensesByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  const sortedCategories = categories
    .map((cat) => ({
      ...cat,
      amount: expensesByCategory[cat.id] || 0,
      percentage: totalExpenses > 0 ? ((expensesByCategory[cat.id] || 0) / totalExpenses) * 100 : 0,
    }))
    .filter((cat) => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (sortedCategories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl bg-card p-6 shadow-card"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Spending by Category</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No expenses yet this month</p>
          <p className="text-xs text-muted-foreground/70">Add your first expense to see the breakdown</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <h3 className="mb-4 text-sm font-semibold text-foreground">Spending by Category</h3>
      
      <div className="space-y-4">
        {sortedCategories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="group"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <span style={{ color: cat.color }}>
                    <IconComponent name={cat.icon} className="h-4 w-4" />
                  </span>
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <span className="text-sm font-semibold">
                ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.percentage}%` }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.05, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {cat.percentage.toFixed(1)}% of total spending
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
