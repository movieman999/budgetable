import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface QuickAddButtonProps {
  onClick: () => void;
}

export function QuickAddButton({ onClick }: QuickAddButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl md:h-16 md:w-16"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Plus className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.5} />
    </motion.button>
  );
}
