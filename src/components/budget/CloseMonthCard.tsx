import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/lib/types";

interface CloseMonthCardProps {
  transactions: Transaction[];
  onCloseMonth: () => void;
  isClosed: boolean;
}

export function CloseMonthCard({ transactions, onCloseMonth, isClosed }: CloseMonthCardProps) {
  const unverifiedCount = transactions.filter((t) => !t.verified).length;
  const totalCount = transactions.length;
  const allVerified = unverifiedCount === 0 && totalCount > 0;

  if (isClosed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-2xl border border-success/30 bg-success/10 p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <Lock className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-success">Month Closed</h3>
            <p className="text-sm text-success/80">
              All transactions verified and balanced.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={`rounded-2xl border p-6 ${
        allVerified
          ? 'border-success/30 bg-success/5'
          : 'border-warning/30 bg-warning/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              allVerified ? 'bg-success/20' : 'bg-warning/20'
            }`}
          >
            {allVerified ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${allVerified ? 'text-success' : 'text-warning-foreground'}`}>
              {allVerified ? 'Ready to Close' : 'Balance Your Books'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalCount === 0
                ? 'Add some transactions first'
                : allVerified
                ? 'All transactions verified. Ready to close this month!'
                : `${unverifiedCount} of ${totalCount} transactions need verification`}
            </p>
          </div>
        </div>

        <Button
          onClick={onCloseMonth}
          disabled={!allVerified}
          variant={allVerified ? 'default' : 'secondary'}
          size="sm"
        >
          <Lock className="mr-1.5 h-3.5 w-3.5" />
          Close Month
        </Button>
      </div>
    </motion.div>
  );
}
