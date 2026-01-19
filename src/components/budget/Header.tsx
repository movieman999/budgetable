import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentMonth: string;
  currentYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
  isClosed: boolean;
  onCloseMonth: () => void;
}

export function Header({
  currentMonth,
  currentYear,
  onPreviousMonth,
  onNextMonth,
  canGoNext,
  isClosed,
  onCloseMonth,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary"
          >
            <span className="text-lg font-bold text-primary-foreground">B</span>
          </motion.div>
          <div>
            <h1 className="text-lg font-bold">Budget</h1>
            {isClosed && (
              <span className="flex items-center gap-1 text-xs text-success">
                <Lock className="h-3 w-3" />
                Month Closed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex min-w-[120px] items-center justify-center gap-1 text-sm font-medium">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {currentMonth} {currentYear}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            disabled={!canGoNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </motion.header>
  );
}
