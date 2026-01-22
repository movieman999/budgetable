import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, PiggyBank, Calendar, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useBudget } from "@/contexts/BudgetContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

type DateRange = 'all' | '3m' | '6m' | '1y' | 'ytd';
type ChartType = 'trend' | 'comparison' | 'category' | 'savings';

export default function Reports() {
  const { transactions, categories, loading } = useBudget();
  
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [chartType, setChartType] = useState<ChartType>('trend');

  const filteredTransactions = useMemo(() => {
    if (dateRange === 'all') return transactions.filter((t) => !t.isForecasted);
    
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return transactions.filter((t) => {
      if (t.isForecasted) return false;
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= now;
    });
  }, [transactions, dateRange]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expenses: number; savings: number; month: string }> = {};
    
    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!data[key]) {
        data[key] = { 
          income: 0, 
          expenses: 0, 
          savings: 0,
          month: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
        };
      }
      
      if (t.type === 'income') {
        data[key].income += t.amount;
      } else {
        data[key].expenses += t.amount;
      }
    });

    Object.keys(data).forEach((key) => {
      data[key].savings = data[key].income - data[key].expenses;
    });

    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, values]) => values);
  }, [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!breakdown[t.category]) {
          breakdown[t.category] = 0;
        }
        breakdown[t.category] += t.amount;
      });

    return Object.entries(breakdown)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name || categoryId,
          value: amount,
          color: category?.color || 'hsl(220 10% 50%)',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, savings: income - expenses };
  }, [filteredTransactions]);

  const averages = useMemo(() => {
    const monthCount = monthlyData.length || 1;
    return {
      income: totals.income / monthCount,
      expenses: totals.expenses / monthCount,
      savings: totals.savings / monthCount,
    };
  }, [totals, monthlyData]);

  const savingsOverTime = useMemo(() => {
    let cumulative = 0;
    return monthlyData.map((d) => {
      cumulative += d.savings;
      return { ...d, cumulativeSavings: cumulative };
    });
  }, [monthlyData]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    filteredTransactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear());
    });
    return Array.from(years).sort();
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Chart Type Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'trend', label: 'Monthly Trends' },
            { id: 'comparison', label: 'Year over Year' },
            { id: 'category', label: 'Category Analysis' },
            { id: 'savings', label: 'Savings Growth' },
          ].map((chart) => (
            <Button
              key={chart.id}
              variant={chartType === chart.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType(chart.id as ChartType)}
              className="text-xs"
            >
              {chart.label}
            </Button>
          ))}
        </div>

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

        {/* Dynamic Chart based on selection */}
        {chartType === 'trend' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-sm font-semibold">Income vs Expenses Over Time</h3>
            {monthlyData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                No data available for selected period
              </div>
            )}
          </motion.div>
        )}

        {chartType === 'savings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-sm font-semibold">Cumulative Savings Growth</h3>
            {savingsOverTime.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeSavings" 
                      stroke="hsl(var(--success))" 
                      fill="hsl(var(--success) / 0.2)" 
                      name="Total Savings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                No data available for selected period
              </div>
            )}
          </motion.div>
        )}

        {chartType === 'category' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {categoryBreakdown.map((cat, index) => {
                  const percentage = totals.expenses > 0 ? (cat.value / totals.expenses) * 100 : 0;
                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-1">
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
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {chartType === 'comparison' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-sm font-semibold">Year over Year Comparison</h3>
            {availableYears.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--income))" strokeWidth={2} dot={false} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                Need data from multiple months to compare
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
