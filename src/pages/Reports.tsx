import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, PiggyBank, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Transaction, DEFAULT_CATEGORIES, MonthSettings } from "@/lib/types";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface ReportsProps {
  transactions: Transaction[];
  monthSettings: Record<string, MonthSettings>;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function Reports({ transactions, monthSettings }: ReportsProps) {
  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expenses: number; savings: number }> = {};
    
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!data[key]) {
        data[key] = { income: 0, expenses: 0, savings: 0 };
      }
      
      if (t.type === 'income') {
        data[key].income += t.amount;
      } else {
        data[key].expenses += t.amount;
      }
    });

    // Calculate savings
    Object.keys(data).forEach((key) => {
      data[key].savings = data[key].income - data[key].expenses;
    });

    // Sort by date and format for charts
    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => {
        const [year, month] = key.split('-');
        return {
          month: `${MONTHS[parseInt(month) - 1]} ${year}`,
          ...values,
        };
      });
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!breakdown[t.category]) {
          breakdown[t.category] = 0;
        }
        breakdown[t.category] += t.amount;
      });

    return Object.entries(breakdown)
      .map(([categoryId, amount]) => {
        const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
        return {
          name: category?.name || categoryId,
          value: amount,
          color: category?.color || 'hsl(220 10% 50%)',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, savings: income - expenses };
  }, [transactions]);

  const averages = useMemo(() => {
    const monthCount = monthlyData.length || 1;
    return {
      income: totals.income / monthCount,
      expenses: totals.expenses / monthCount,
      savings: totals.savings / monthCount,
    };
  }, [totals, monthlyData]);

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Reports</h1>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Totals Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income/20">
                <TrendingUp className="h-5 w-5 text-income" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-income">
              ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Avg: ${averages.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">
              ${totals.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Avg: ${averages.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <PiggyBank className="h-5 w-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total Savings</p>
            <p className={`text-2xl font-bold ${totals.savings >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${Math.abs(totals.savings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Avg: ${averages.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
            </p>
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card p-6 shadow-card"
        >
          <h3 className="mb-4 text-sm font-semibold">Monthly Trends</h3>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="hsl(var(--income))"
                    fill="hsl(var(--income))"
                    fillOpacity={0.3}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stackId="2"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success))"
                    fillOpacity={0.3}
                    name="Savings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </motion.div>

        {/* Expenses by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold">Spending by Category</h3>
            {categoryBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No expenses recorded
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold">Category Breakdown</h3>
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 6).map((cat, index) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    ${cat.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Monthly Comparison Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card p-6 shadow-card"
        >
          <h3 className="mb-4 text-sm font-semibold">Income vs Expenses</h3>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--income))" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default Reports;
