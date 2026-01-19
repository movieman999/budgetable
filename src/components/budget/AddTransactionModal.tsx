import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Receipt, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CATEGORIES, Transaction } from "@/lib/types";
import { IconComponent } from "@/lib/icons";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export function AddTransactionModal({ open, onClose, onAdd }: AddTransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    onAdd({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(),
      verified: false,
    });
    
    // Reset form
    setAmount('');
    setDescription('');
    setCategory(DEFAULT_CATEGORIES[0].id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card p-0 shadow-lg">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold">Add Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
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

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
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
            Add {type === 'expense' ? 'Expense' : 'Income'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
