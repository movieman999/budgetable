import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurringTemplate, Category, Account, RecurringSchedule } from "@/lib/types";
import { IconComponent } from "@/lib/icons";

interface AddRecurringModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (template: Omit<RecurringTemplate, 'id'>) => void;
  onUpdate?: (template: RecurringTemplate) => void;
  editingTemplate?: RecurringTemplate | null;
  categories: Category[];
  accounts: Account[];
}

export function AddRecurringModal({
  open,
  onClose,
  onAdd,
  onUpdate,
  editingTemplate,
  categories,
  accounts,
}: AddRecurringModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [accountId, setAccountId] = useState('checking');
  const [scheduleType, setScheduleType] = useState<RecurringSchedule['type']>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [customDays, setCustomDays] = useState('30');

  useEffect(() => {
    if (editingTemplate) {
      setType(editingTemplate.type);
      setAmount(editingTemplate.amount.toString());
      setDescription(editingTemplate.description);
      setCategory(editingTemplate.category);
      setAccountId(editingTemplate.accountId || 'checking');
      setScheduleType(editingTemplate.schedule.type);
      setStartDate(new Date(editingTemplate.schedule.startDate).toISOString().split('T')[0]);
      setDayOfMonth((editingTemplate.schedule.dayOfMonth || 1).toString());
      setCustomDays((editingTemplate.schedule.customDays || 30).toString());
    } else {
      resetForm();
    }
  }, [editingTemplate, open]);

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDescription('');
    setCategory('other');
    setAccountId('checking');
    setScheduleType('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDayOfMonth('1');
    setCustomDays('30');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const schedule: RecurringSchedule = {
      type: scheduleType,
      startDate: new Date(startDate),
      ...(scheduleType === 'monthly' && { dayOfMonth: parseInt(dayOfMonth) }),
      ...(scheduleType === 'custom' && { customDays: parseInt(customDays) }),
    };

    const templateData = {
      type,
      amount: parseFloat(amount),
      description,
      category,
      accountId,
      schedule,
      isActive: true,
    };

    if (editingTemplate && onUpdate) {
      onUpdate({ ...editingTemplate, ...templateData });
    } else {
      onAdd(templateData);
    }
    
    onClose();
    resetForm();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="mb-6 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">
              {editingTemplate ? 'Edit Recurring' : 'Add Recurring'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                className={`flex-1 ${type === 'expense' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                className={`flex-1 ${type === 'income' ? 'bg-income text-white hover:bg-income/90' : ''}`}
                onClick={() => setType('income')}
              >
                Income
              </Button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
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
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Monthly Salary, Rent, Netflix"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }}>
                          <IconComponent name={cat.icon} className="h-4 w-4" />
                        </span>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: account.color }} 
                        />
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Type */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as RecurringSchedule['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Every Week</SelectItem>
                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day of Month (for monthly) */}
            {scheduleType === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}{getOrdinalSuffix(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Days */}
            {scheduleType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customDays">Every X Days</Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Starting From</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              {editingTemplate ? 'Update Recurring' : 'Create Recurring'}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
