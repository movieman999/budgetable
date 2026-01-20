import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, PiggyBank, Calendar, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Transaction, Category, MonthSettings } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
  monthSettings: Record<string, MonthSettings>;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type DateRange = 'all' | '3m' | '6m' | '1y' | 'ytd' | 'custom';
type ChartType = 'trend' | 'comparison' | 'category' | 'savings';

export function Reports({ transactions, categories, monthSettings }: ReportsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [chartType, setChartType] = useState<ChartType>('trend');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const categoryFilteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') return filteredTransactions;
    return filteredTransactions.filter((t) => t.category === selectedCategory);
  }, [filteredTransactions, selectedCategory]);

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
    const income = categoryFilteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = categoryFilteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, savings: income - expenses };
  }, [categoryFilteredTransactions]);

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

  // Year over Year comparison
  const yoyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: Record<number, Record<number, { income: number; expenses: number }>> = {};
    
    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      if (!years[year]) years[year] = {};
      if (!years[year][month]) years[year][month] = { income: 0, expenses: 0 };
      
      if (t.type === 'income') {
        years[year][month].income += t.amount;
      } else {
        years[year][month].expenses += t.amount;
      }
    });
    
    return FULL_MONTHS.map((monthName, index) => {
      const result: Record<string, string | number> = { month: MONTHS[index] };
      Object.keys(years).forEach((year) => {
        const yearData = years[parseInt(year)][index];
        result[`${year} Income`] = yearData?.income || 0;
        result[`${year} Expenses`] = yearData?.expenses || 0;
      });
      return result;
    });
  }, [filteredTransactions]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    filteredTransactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear());
    });
    return Array.from(years).sort();
  }, [filteredTransactions]);

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
                  <LineChart data={yoyData}>
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
                    {availableYears.map((year, index) => (
                      <Line
                        key={`${year}-expenses`}
                        type="monotone"
                        dataKey={`${year} Expenses`}
                        stroke={`hsl(${(index * 60) % 360} 70% 50%)`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
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
                  const percentage = (cat.value / totals.expenses) * 100;
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
                      <div className="ml-6 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {chartType === 'savings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 shadow-card"
          >
            <h3 className="mb-4 text-sm font-semibold">Cumulative Savings Over Time</h3>
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
                      fill="hsl(var(--success))"
                      fillOpacity={0.3}
                      name="Total Savings"
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      name="Monthly Savings"
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
      </main>
    </div>
  );
}

export default Reports;
