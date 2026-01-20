import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Palette, FolderOpen, Save, Upload, Download, Lock, Tags, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, Account } from "@/lib/types";
import { IconComponent } from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateAccounts: (accounts: Account[]) => void;
  onBackup: (key: string) => void;
  onRestore: (file: File, key: string) => void;
}

const ICON_OPTIONS = [
  'Home', 'Utensils', 'Car', 'Zap', 'Film', 'ShoppingBag', 'Heart', 
  'Smartphone', 'Book', 'Gift', 'Plane', 'Coffee', 'Music', 'Gamepad2',
  'GraduationCap', 'Briefcase', 'Baby', 'PawPrint', 'Dumbbell', 'MoreHorizontal'
];

const COLOR_OPTIONS = [
  'hsl(175 60% 35%)', 'hsl(38 92% 50%)', 'hsl(200 85% 45%)', 'hsl(280 60% 50%)',
  'hsl(340 75% 55%)', 'hsl(160 65% 40%)', 'hsl(0 70% 55%)', 'hsl(220 10% 50%)',
  'hsl(50 90% 45%)', 'hsl(100 60% 40%)', 'hsl(250 70% 55%)', 'hsl(320 70% 50%)'
];

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
];

export function SettingsModal({
  open,
  onClose,
  categories,
  accounts,
  onUpdateCategories,
  onUpdateAccounts,
  onBackup,
  onRestore,
}: SettingsModalProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);
  const [backupKey, setBackupKey] = useState('');
  const [restoreKey, setRestoreKey] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: `custom-${Date.now()}`,
      name: 'New Category',
      icon: 'FolderOpen',
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
    };
    setLocalCategories([...localCategories, newCategory]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<Category>) => {
    setLocalCategories(localCategories.map((c) => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const handleDeleteCategory = (id: string) => {
    setLocalCategories(localCategories.filter((c) => c.id !== id));
  };

  const handleAddAccount = () => {
    const newAccount: Account = {
      id: `account-${Date.now()}`,
      name: 'New Account',
      type: 'checking',
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
    };
    setLocalAccounts([...localAccounts, newAccount]);
  };

  const handleUpdateAccount = (id: string, updates: Partial<Account>) => {
    setLocalAccounts(localAccounts.map((a) => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const handleDeleteAccount = (id: string) => {
    setLocalAccounts(localAccounts.filter((a) => a.id !== id));
  };

  const handleSaveCategories = () => {
    onUpdateCategories(localCategories);
  };

  const handleSaveAccounts = () => {
    onUpdateAccounts(localAccounts);
  };

  const handleBackup = () => {
    if (backupKey.length < 4) {
      alert('Please enter a password with at least 4 characters');
      return;
    }
    onBackup(backupKey);
    setBackupKey('');
  };

  const handleRestore = () => {
    if (!restoreFile || restoreKey.length < 4) {
      alert('Please select a file and enter your password');
      return;
    }
    onRestore(restoreFile, restoreKey);
    setRestoreFile(null);
    setRestoreKey('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories" className="text-xs">
              <Tags className="mr-1 h-3 w-3" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs">
              <CreditCard className="mr-1 h-3 w-3" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="backup" className="text-xs">
              <Lock className="mr-1 h-3 w-3" />
              Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-4 space-y-4">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {localCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span style={{ color: category.color }}>
                      <IconComponent name={category.icon} className="h-4 w-4" />
                    </span>
                  </div>
                  <Input
                    value={category.name}
                    onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                    className="h-8 flex-1"
                  />
                  <Select
                    value={category.icon}
                    onValueChange={(v) => handleUpdateCategory(category.id, { icon: v })}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <IconComponent name={category.icon} className="h-3 w-3" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <IconComponent name={icon} className="h-3 w-3" />
                            <span className="text-xs">{icon}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {COLOR_OPTIONS.slice(0, 4).map((color) => (
                      <button
                        key={color}
                        onClick={() => handleUpdateCategory(category.id, { color })}
                        className={`h-5 w-5 rounded-full border-2 ${
                          category.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handleAddCategory}>
                <Plus className="mr-1 h-3 w-3" />
                Add Category
              </Button>
              <Button size="sm" onClick={handleSaveCategories}>
                <Save className="mr-1 h-3 w-3" />
                Save
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-4 space-y-4">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {localAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <Input
                    value={account.name}
                    onChange={(e) => handleUpdateAccount(account.id, { name: e.target.value })}
                    className="h-8 flex-1"
                  />
                  <Select
                    value={account.type}
                    onValueChange={(v: Account['type']) => handleUpdateAccount(account.id, { type: v })}
                  >
                    <SelectTrigger className="h-8 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {COLOR_OPTIONS.slice(0, 4).map((color) => (
                      <button
                        key={color}
                        onClick={() => handleUpdateAccount(account.id, { color })}
                        className={`h-5 w-5 rounded-full border-2 ${
                          account.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAccount(account.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handleAddAccount}>
                <Plus className="mr-1 h-3 w-3" />
                Add Account
              </Button>
              <Button size="sm" onClick={handleSaveAccounts}>
                <Save className="mr-1 h-3 w-3" />
                Save
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="mt-4 space-y-6">
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Download className="h-4 w-4" />
                Backup Data
              </h4>
              <p className="text-xs text-muted-foreground">
                Export all your data as an encrypted file. You'll need the password to restore it later.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Encryption password"
                  value={backupKey}
                  onChange={(e) => setBackupKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleBackup} disabled={backupKey.length < 4}>
                  <Download className="mr-1 h-4 w-4" />
                  Backup
                </Button>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Upload className="h-4 w-4" />
                Restore Data
              </h4>
              <p className="text-xs text-muted-foreground">
                Import data from a backup file. This will replace all current data.
              </p>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".budgetbackup"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                />
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Encryption password"
                    value={restoreKey}
                    onChange={(e) => setRestoreKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleRestore} disabled={!restoreFile || restoreKey.length < 4}>
                    <Upload className="mr-1 h-4 w-4" />
                    Restore
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
