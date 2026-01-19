import { 
  Home, 
  Utensils, 
  Car, 
  Zap, 
  Film, 
  ShoppingBag, 
  Heart, 
  MoreHorizontal,
  LucideIcon
} from "lucide-react";
import React from "react";

const iconMap: Record<string, LucideIcon> = {
  Home,
  Utensils,
  Car,
  Zap,
  Film,
  ShoppingBag,
  Heart,
  MoreHorizontal,
};

export function IconComponent({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
