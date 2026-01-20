import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Receipt, DollarSign, ArrowUpCircle, ArrowDownCircle, RefreshCw, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, Account, Transaction, RecurringSchedule } from "@/lib/types";
import { IconComponent } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  editingTransaction?: Transaction | null;
  onUpdate?: (transaction: Transaction) => void;
  categories: Category[];
  accounts: Account[];
}

export function AddTransactionModal({ open, onClose, onAdd, editingTransaction, onUpdate, categories, accounts }: AddTransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'other');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'checking');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<RecurringSchedule['type']>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [customDays, setCustomDays] = useState('30');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setAccountId(editingTransaction.accountId || accounts[0]?.id || 'checking');
      setIsRecurring(editingTransaction.isRecurring || false);
      if (editingTransaction.recurringSchedule) {
        setRecurringType(editingTransaction.recurringSchedule.type);
        setStartDate(new Date(editingTransaction.recurringSchedule.startDate));
        if (editingTransaction.recurringSchedule.customDays) {
          setCustomDays(editingTransaction.recurringSchedule.customDays.toString());
        }
        if (editingTransaction.recurringSchedule.dayOfMonth) {
          setDayOfMonth(editingTransaction.recurringSchedule.dayOfMonth.toString());
        }
      }
    } else {
      resetForm();
    }
  }, [editingTransaction, open]);

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDescription('');
    setCategory(categories[0]?.id || 'other');
    setAccountId(accounts[0]?.id || 'checking');
    setIsRecurring(false);
    setRecurringType('monthly');
    setStartDate(new Date());
    setCustomDays('30');
    setDayOfMonth('1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const recurringSchedule: RecurringSchedule | undefined = isRecurring
      ? {
          type: recurringType,
          startDate,
          customDays: recurringType === 'custom' ? parseInt(customDays) : undefined,
          dayOfMonth: recurringType === 'monthly' ? parseInt(dayOfMonth) : undefined,
        }
      : undefined;

    const transactionData = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: isRecurring ? startDate : new Date(),
      verified: false,
      accountId,
      isRecurring,
      recurringSchedule,
    };

    if (editingTransaction && onUpdate) {
      onUpdate({
        ...editingTransaction,
        ...transactionData,
      });
    } else {
      onAdd(transactionData);
    }

    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-border bg-card p-0 shadow-lg">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Type Toggle */}
          <div className="flex gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                type === 'expense'
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                type === 'income'
                  ? 'bg-income text-income-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 text-lg font-semibold"
                autoFocus
              />
            </div>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: account.color }}
                      />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                    category === cat.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent name={cat.icon} className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{cat.name.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Recurring</p>
                <p className="text-xs text-muted-foreground">Repeat this transaction</p>
              </div>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {/* Recurring Options */}
          {isRecurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="space-y-2">
                <Label className="text-sm font-medium">Frequency</Label>
                <Select value={recurringType} onValueChange={(v) => setRecurringType(v as RecurringSchedule['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom (every X days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurringType === 'custom' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Every how many days?</Label>
                  <Input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="30"
                  />
                </div>
              )}

              {recurringType === 'monthly' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Day of month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    placeholder="1"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Starting from</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) setStartDate(date);
                        setDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </motion.div>
          )}

          {/* Receipt Scan Button */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Camera className="h-4 w-4" />
            Scan receipt to auto-fill
          </button>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg">
            <Receipt className="mr-2 h-4 w-4" />
            {editingTransaction ? 'Update' : 'Add'} {type === 'expense' ? 'Expense' : 'Income'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
