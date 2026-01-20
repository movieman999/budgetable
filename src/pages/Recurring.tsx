import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Trash2, Edit2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecurringTemplate, Category, Account } from "@/lib/types";
import { IconComponent } from "@/lib/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddRecurringModal } from "@/components/budget/AddRecurringModal";
import { format } from "date-fns";

interface RecurringPageProps {
  templates: RecurringTemplate[];
  categories: Category[];
  accounts: Account[];
  onAddTemplate: (template: Omit<RecurringTemplate, 'id'>) => void;
  onUpdateTemplate: (template: RecurringTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export default function Recurring({
  templates,
  categories,
  accounts,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onToggleActive,
}: RecurringPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories.find((c) => c.id === 'other') || categories[0];
  };

  const getAccountInfo = (accountId: string | undefined) => {
    if (!accountId) return null;
    return accounts.find((a) => a.id === accountId);
  };

  const getScheduleLabel = (template: RecurringTemplate) => {
    const schedule = template.schedule;
    switch (schedule.type) {
      case 'weekly':
        return 'Every week';
      case 'biweekly':
        return 'Every 2 weeks';
      case 'monthly':
        return schedule.dayOfMonth 
          ? `Monthly on the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth)}`
          : 'Monthly';
      case 'custom':
        return `Every ${schedule.customDays} days`;
      default:
        return 'Recurring';
    }
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const incomeTemplates = templates.filter(t => t.type === 'income');
  const expenseTemplates = templates.filter(t => t.type === 'expense');

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteTemplate(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  const handleEdit = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setIsAddModalOpen(true);
  };

  const TemplateCard = ({ template }: { template: RecurringTemplate }) => {
    const category = getCategoryInfo(template.category);
    const account = getAccountInfo(template.accountId);
    const isIncome = template.type === 'income';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group flex items-center gap-3 rounded-xl p-4 bg-card border border-border transition-all hover:shadow-md ${
          !template.isActive ? 'opacity-50' : ''
        }`}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: category ? `${category.color}15` : undefined }}
        >
          <span style={{ color: category?.color }}>
            <IconComponent name={category?.icon || 'MoreHorizontal'} className="h-5 w-5" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{template.description}</p>
            {!template.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>{getScheduleLabel(template)}</span>
            <span>•</span>
            <span>Started {format(new Date(template.schedule.startDate), 'MMM d, yyyy')}</span>
          </div>
          {account && (
            <span 
              className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${account.color}20`, color: account.color }}
            >
              {account.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isIncome ? 'text-income' : 'text-destructive'}`}>
            {isIncome ? '+' : '-'}${template.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleActive(template.id)}
              title={template.isActive ? 'Pause' : 'Resume'}
            >
              {template.isActive ? (
                <Pause className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Play className="h-4 w-4 text-success" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(template)}
            >
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmId(template.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Recurring</h1>
              <p className="text-xs text-muted-foreground">Manage recurring income & expenses</p>
            </div>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Recurring
          </Button>
        </div>
      </motion.header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Income Section */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-income">
            <RefreshCw className="h-4 w-4" />
            Recurring Income ({incomeTemplates.length})
          </h2>
          {incomeTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <p className="text-sm">No recurring income set up yet</p>
              <p className="text-xs">Add salary, investments, or other regular income</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomeTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </section>

        {/* Expenses Section */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
            <RefreshCw className="h-4 w-4" />
            Recurring Expenses ({expenseTemplates.length})
          </h2>
          {expenseTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <p className="text-sm">No recurring expenses set up yet</p>
              <p className="text-xs">Add rent, subscriptions, or other regular expenses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenseTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </section>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground mb-1">How recurring works:</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>Future occurrences appear as forecasted (dashed) items in your month view</li>
            <li>When the date arrives, items become editable individual transactions</li>
            <li>Editing a transaction in month view only affects that instance, not future ones</li>
            <li>Pause a recurring item to stop future occurrences without deleting it</li>
          </ul>
        </motion.div>
      </main>

      <AddRecurringModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTemplate(null);
        }}
        onAdd={onAddTemplate}
        onUpdate={onUpdateTemplate}
        editingTemplate={editingTemplate}
        categories={categories}
        accounts={accounts}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring item? This will stop future occurrences but won't affect past transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
