import { Transaction, Category, Account, MonthSettings } from "./types";

export interface AppData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  monthSettings: Record<string, MonthSettings>;
  closedMonths: string[];
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
  encryptionKey: string
): string {
  const appData: AppData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    transactions: transactions.map((t) => ({
      ...t,
      date: t.date instanceof Date ? t.date.toISOString() : t.date,
      recurringSchedule: t.recurringSchedule ? {
        ...t.recurringSchedule,
        startDate: t.recurringSchedule.startDate instanceof Date 
          ? t.recurringSchedule.startDate.toISOString() 
          : t.recurringSchedule.startDate,
      } : undefined,
    })) as unknown as Transaction[],
    categories,
    accounts,
    monthSettings,
    closedMonths,
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
      recurringSchedule: t.recurringSchedule ? {
        ...t.recurringSchedule,
        startDate: new Date(t.recurringSchedule.startDate),
      } : undefined,
    }));

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
