import { Transaction, Category, Account, MonthSettings, RecurringTemplate } from "./types";

export interface AppData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  monthSettings: Record<string, MonthSettings>;
  closedMonths: string[];
  recurringTemplates?: RecurringTemplate[];
}

// Simple encryption using base64 + a key-based XOR
function encrypt(data: string, key: string): string {
  const keyChars = key.split('').map((c) => c.charCodeAt(0));
  const encrypted = data.split('').map((char, i) => {
    const keyChar = keyChars[i % keyChars.length];
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
  }).join('');
  return btoa(encrypted);
}

function decrypt(data: string, key: string): string {
  const decoded = atob(data);
  const keyChars = key.split('').map((c) => c.charCodeAt(0));
  return decoded.split('').map((char, i) => {
    const keyChar = keyChars[i % keyChars.length];
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
  }).join('');
}

export function exportData(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  monthSettings: Record<string, MonthSettings>,
  closedMonths: string[],
  encryptionKey: string,
  recurringTemplates?: RecurringTemplate[]
): string {
  const appData: AppData = {
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    transactions: transactions.map((t) => ({
      ...t,
      date: t.date instanceof Date ? t.date.toISOString() : t.date,
    })) as unknown as Transaction[],
    categories,
    accounts,
    monthSettings,
    closedMonths,
    recurringTemplates: recurringTemplates?.map((t) => ({
      ...t,
      schedule: {
        ...t.schedule,
        startDate: t.schedule.startDate instanceof Date
          ? t.schedule.startDate.toISOString()
          : t.schedule.startDate,
        endDate: t.schedule.endDate instanceof Date
          ? t.schedule.endDate.toISOString()
          : t.schedule.endDate,
      }
    })) as unknown as RecurringTemplate[],
  };

  const jsonData = JSON.stringify(appData);
  return encrypt(jsonData, encryptionKey);
}

export function importData(encryptedData: string, encryptionKey: string): AppData | null {
  try {
    const jsonData = decrypt(encryptedData, encryptionKey);
    const appData = JSON.parse(jsonData) as AppData;
    
    // Convert date strings back to Date objects
    appData.transactions = appData.transactions.map((t) => ({
      ...t,
      date: new Date(t.date),
    }));

    // Convert recurring template dates
    if (appData.recurringTemplates) {
      appData.recurringTemplates = appData.recurringTemplates.map((t) => ({
        ...t,
        schedule: {
          ...t.schedule,
          startDate: new Date(t.schedule.startDate),
          endDate: t.schedule.endDate ? new Date(t.schedule.endDate) : undefined,
        }
      }));
    }

    return appData;
  } catch (error) {
    console.error('Failed to import data:', error);
    return null;
  }
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
