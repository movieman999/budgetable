import { useState } from "react";
import { FileUp, FileDown, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Transaction, Category, Account, RecurringTemplate } from "@/lib/types";

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  recurringTemplates: RecurringTemplate[];
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => Promise<void>;
  onImportCategories: (categories: Omit<Category, 'id'>[]) => Promise<void>;
  onImportAccounts: (accounts: Omit<Account, 'id'>[]) => Promise<void>;
  onImportRecurringTemplates: (templates: Omit<RecurringTemplate, 'id'>[]) => Promise<void>;
}

type DataType = 'transactions' | 'categories' | 'accounts' | 'recurring';

const TEMPLATES = {
  transactions: `type,amount,category,description,date,verified,accountId
expense,50.00,food,Grocery shopping,2024-01-15,false,
income,3000.00,other,Monthly salary,2024-01-01,true,
expense,120.00,utilities,Electric bill,2024-01-10,true,`,
  categories: `name,icon,color
Groceries,ShoppingBag,hsl(160 65% 40%)
Subscriptions,Smartphone,hsl(280 60% 50%)`,
  accounts: `name,type,color
Main Checking,checking,hsl(200 85% 45%)
Emergency Savings,savings,hsl(160 65% 40%)
Travel Card,credit,hsl(280 60% 50%)`,
  recurring: `type,amount,category,description,scheduleType,startDate,dayOfMonth,isActive
expense,150.00,utilities,Electric Bill,monthly,2024-01-01,15,true
income,3000.00,other,Monthly Salary,monthly,2024-01-01,1,true
expense,15.99,entertainment,Netflix,monthly,2024-01-01,5,true`,
};

export function ImportExportModal({
  open,
  onClose,
  transactions,
  categories,
  accounts,
  recurringTemplates,
  onImportTransactions,
  onImportCategories,
  onImportAccounts,
  onImportRecurringTemplates,
}: ImportExportModalProps) {
  const [exportType, setExportType] = useState<DataType>('transactions');
  const [importType, setImportType] = useState<DataType>('transactions');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = (type: DataType) => {
    const content = TEMPLATES[type];
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const exportData = (type: DataType) => {
    let csvContent = '';
    
    switch (type) {
      case 'transactions':
        csvContent = 'type,amount,category,description,date,verified,accountId\n';
        transactions.forEach(t => {
          const dateStr = t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date;
          csvContent += `${t.type},${t.amount},${t.category},${escapeCSV(t.description)},${dateStr},${t.verified},${t.accountId || ''}\n`;
        });
        break;
      case 'categories':
        csvContent = 'name,icon,color\n';
        categories.forEach(c => {
          csvContent += `${escapeCSV(c.name)},${c.icon},${c.color}\n`;
        });
        break;
      case 'accounts':
        csvContent = 'name,type,color\n';
        accounts.forEach(a => {
          csvContent += `${escapeCSV(a.name)},${a.type},${a.color}\n`;
        });
        break;
      case 'recurring':
        csvContent = 'type,amount,category,description,scheduleType,startDate,dayOfMonth,isActive\n';
        recurringTemplates.forEach(t => {
          const startDateStr = t.schedule.startDate instanceof Date 
            ? t.schedule.startDate.toISOString().split('T')[0] 
            : t.schedule.startDate;
          csvContent += `${t.type},${t.amount},${t.category},${escapeCSV(t.description)},${t.schedule.type},${startDateStr},${t.schedule.dayOfMonth || ''},${t.isActive}\n`;
        });
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${type} exported successfully`);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('File is empty or has no data rows');
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const dataRows = lines.slice(1).map(line => parseCSVLine(line));

      switch (importType) {
        case 'transactions': {
          const txs: Omit<Transaction, 'id'>[] = dataRows.map(row => ({
            type: (row[headers.indexOf('type')] || 'expense') as 'income' | 'expense',
            amount: parseFloat(row[headers.indexOf('amount')] || '0'),
            category: row[headers.indexOf('category')] || 'other',
            description: row[headers.indexOf('description')] || '',
            date: new Date(row[headers.indexOf('date')] || new Date()),
            verified: row[headers.indexOf('verified')]?.toLowerCase() === 'true',
            accountId: row[headers.indexOf('accountId')] || undefined,
          }));
          await onImportTransactions(txs);
          break;
        }
        case 'categories': {
          const cats: Omit<Category, 'id'>[] = dataRows.map(row => ({
            name: row[headers.indexOf('name')] || 'New Category',
            icon: row[headers.indexOf('icon')] || 'FolderOpen',
            color: row[headers.indexOf('color')] || 'hsl(200 85% 45%)',
          }));
          await onImportCategories(cats);
          break;
        }
        case 'accounts': {
          const accs: Omit<Account, 'id'>[] = dataRows.map(row => ({
            name: row[headers.indexOf('name')] || 'New Account',
            type: (row[headers.indexOf('type')] || 'checking') as Account['type'],
            color: row[headers.indexOf('color')] || 'hsl(200 85% 45%)',
          }));
          await onImportAccounts(accs);
          break;
        }
        case 'recurring': {
          const templates: Omit<RecurringTemplate, 'id'>[] = dataRows.map(row => ({
            type: (row[headers.indexOf('type')] || 'expense') as 'income' | 'expense',
            amount: parseFloat(row[headers.indexOf('amount')] || '0'),
            category: row[headers.indexOf('category')] || 'other',
            description: row[headers.indexOf('description')] || '',
            schedule: {
              type: (row[headers.indexOf('scheduleType')] || 'monthly') as RecurringTemplate['schedule']['type'],
              startDate: new Date(row[headers.indexOf('startDate')] || new Date()),
              dayOfMonth: row[headers.indexOf('dayOfMonth')] ? parseInt(row[headers.indexOf('dayOfMonth')]) : undefined,
            },
            isActive: row[headers.indexOf('isActive')]?.toLowerCase() !== 'false',
          }));
          await onImportRecurringTemplates(templates);
          break;
        }
      }
      
      setImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file. Please check the format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import / Export Data
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <FileDown className="mr-1.5 h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <FileUp className="mr-1.5 h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your data as CSV files for use in spreadsheets or other apps.
            </p>
            
            <div className="space-y-3">
              <Label>Data Type</Label>
              <Select value={exportType} onValueChange={(v) => setExportType(v as DataType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Transactions ({transactions.length})</SelectItem>
                  <SelectItem value="categories">Categories ({categories.length})</SelectItem>
                  <SelectItem value="accounts">Accounts ({accounts.length})</SelectItem>
                  <SelectItem value="recurring">Recurring Templates ({recurringTemplates.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => exportData(exportType)} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export {exportType}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Import data from CSV files. Download a template first to see the required format.
            </p>

            <div className="space-y-3">
              <Label>Data Type</Label>
              <Select value={importType} onValueChange={(v) => setImportType(v as DataType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="categories">Categories</SelectItem>
                  <SelectItem value="accounts">Accounts</SelectItem>
                  <SelectItem value="recurring">Recurring Templates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => downloadTemplate(importType)}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download {importType} Template
            </Button>

            <div className="space-y-2">
              <Label>Select CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={!importFile || isImporting}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? 'Importing...' : `Import ${importType}`}
            </Button>

            <div className="rounded-lg border border-muted bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Imported items will be added to your existing data, not replace it.
                Make sure your CSV follows the template format exactly.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function escapeCSV(str: string): string {
  if (!str) return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}
