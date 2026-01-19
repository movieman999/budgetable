import { useState, useEffect } from "react";
import { DollarSign, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_ACCOUNTS, MonthSettings } from "@/lib/types";

interface StartingBalanceModalProps {
  open: boolean;
  onClose: () => void;
  currentSettings: MonthSettings;
  onSave: (settings: MonthSettings) => void;
  monthLabel: string;
}

export function StartingBalanceModal({ 
  open, 
  onClose, 
  currentSettings, 
  onSave,
  monthLabel 
}: StartingBalanceModalProps) {
  const [startingBalance, setStartingBalance] = useState(currentSettings.startingBalance.toString());
  const [accountBalances, setAccountBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    setStartingBalance(currentSettings.startingBalance.toString());
    const balances: Record<string, string> = {};
    DEFAULT_ACCOUNTS.forEach((account) => {
      balances[account.id] = (currentSettings.accountBalances[account.id] || 0).toString();
    });
    setAccountBalances(balances);
  }, [currentSettings, open]);

  const handleSave = () => {
    const parsedAccountBalances: Record<string, number> = {};
    Object.entries(accountBalances).forEach(([id, value]) => {
      parsedAccountBalances[id] = parseFloat(value) || 0;
    });

    onSave({
      startingBalance: parseFloat(startingBalance) || 0,
      accountBalances: parsedAccountBalances,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="h-5 w-5 text-primary" />
            Starting Balances - {monthLabel}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="starting-balance" className="text-sm font-medium">
              Total Starting Balance
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="starting-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="pl-9 text-lg font-semibold"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your total balance across all accounts at the start of this month
            </p>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Account Balances (optional)</Label>
            {DEFAULT_ACCOUNTS.map((account) => (
              <div key={account.id} className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${account.color}20` }}
                >
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: account.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{account.name}</p>
                </div>
                <div className="relative w-32">
                  <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={accountBalances[account.id] || ''}
                    onChange={(e) => setAccountBalances(prev => ({
                      ...prev,
                      [account.id]: e.target.value
                    }))}
                    className="h-9 pl-6 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Balances
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
