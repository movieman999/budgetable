import { Transaction, RecurringSchedule } from "./types";
import { addDays, addWeeks, addMonths, setDate, isAfter, isBefore, startOfMonth, endOfMonth, isSameMonth } from "date-fns";

export function generateForecastedTransactions(
  recurringTransactions: Transaction[],
  targetMonth: Date
): Transaction[] {
  const forecasted: Transaction[] = [];
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  recurringTransactions.forEach((transaction) => {
    if (!transaction.isRecurring || !transaction.recurringSchedule) return;

    const schedule = transaction.recurringSchedule;
    const startDate = new Date(schedule.startDate);

    // Generate occurrences for this month
    const occurrences = getOccurrencesInMonth(startDate, schedule, monthStart, monthEnd);

    occurrences.forEach((date, index) => {
      // Only forecast future dates
      if (isAfter(date, today) || isSameMonth(date, targetMonth)) {
        const isFuture = isAfter(date, today);
        forecasted.push({
          ...transaction,
          id: `${transaction.id}-forecast-${date.getTime()}`,
          date,
          verified: false,
          isForecasted: isFuture,
          recurringParentId: transaction.id,
        });
      }
    });
  });

  return forecasted;
}

function getOccurrencesInMonth(
  startDate: Date,
  schedule: RecurringSchedule,
  monthStart: Date,
  monthEnd: Date
): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);

  // If the start date is after the month end, no occurrences
  if (isAfter(currentDate, monthEnd)) return [];

  // Move to the first occurrence in or after the month start
  while (isBefore(currentDate, monthStart)) {
    currentDate = getNextOccurrence(currentDate, schedule);
  }

  // Collect all occurrences within the month
  while (!isAfter(currentDate, monthEnd)) {
    occurrences.push(new Date(currentDate));
    currentDate = getNextOccurrence(currentDate, schedule);
  }

  return occurrences;
}

function getNextOccurrence(currentDate: Date, schedule: RecurringSchedule): Date {
  switch (schedule.type) {
    case 'weekly':
      return addWeeks(currentDate, 1);
    case 'biweekly':
      return addWeeks(currentDate, 2);
    case 'monthly':
      // If a specific day of month is set, use that
      if (schedule.dayOfMonth) {
        let nextMonth = addMonths(currentDate, 1);
        // Handle months with fewer days
        const maxDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(schedule.dayOfMonth, maxDay);
        return setDate(nextMonth, targetDay);
      }
      return addMonths(currentDate, 1);
    case 'custom':
      return addDays(currentDate, schedule.customDays || 30);
    default:
      return addMonths(currentDate, 1);
  }
}

export function mergeTransactionsWithForecasted(
  existingTransactions: Transaction[],
  forecastedTransactions: Transaction[]
): Transaction[] {
  // Remove any forecasted transactions that have been replaced by real ones
  const existingParentIds = new Set(
    existingTransactions
      .filter((t) => t.recurringParentId)
      .map((t) => `${t.recurringParentId}-${new Date(t.date).toDateString()}`)
  );

  const uniqueForecasted = forecastedTransactions.filter((ft) => {
    const key = `${ft.recurringParentId}-${new Date(ft.date).toDateString()}`;
    return !existingParentIds.has(key);
  });

  return [...existingTransactions, ...uniqueForecasted];
}
