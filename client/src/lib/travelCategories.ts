import {
  Plane,
  Hotel,
  Stamp,
  Shield,
  Bus,
  Tent,
  FileText,
  Package,
} from "lucide-react";
import type { TravelItemCategory } from "../api/travelItems.api";

type CategoryMeta = {
  icon: typeof Plane;
  label: string;
  accent: string;
  soft: string;
  ring: string;
};

const categoryMeta: Record<TravelItemCategory, CategoryMeta> = {
  Flight: {
    icon: Plane,
    label: "Flight",
    accent: "text-sky-700",
    soft: "bg-sky-50",
    ring: "ring-sky-200",
  },
  Hotel: {
    icon: Hotel,
    label: "Hotel",
    accent: "text-violet-700",
    soft: "bg-violet-50",
    ring: "ring-violet-200",
  },
  Visa: {
    icon: Stamp,
    label: "Visa",
    accent: "text-amber-700",
    soft: "bg-amber-50",
    ring: "ring-amber-200",
  },
  Insurance: {
    icon: Shield,
    label: "Insurance",
    accent: "text-emerald-700",
    soft: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  Transportation: {
    icon: Bus,
    label: "Transportation",
    accent: "text-orange-700",
    soft: "bg-orange-50",
    ring: "ring-orange-200",
  },
  Activity: {
    icon: Tent,
    label: "Activity",
    accent: "text-brand",
    soft: "bg-brand/10",
    ring: "ring-brand/25",
  },
  Document: {
    icon: FileText,
    label: "Document",
    accent: "text-slate-700",
    soft: "bg-slate-100",
    ring: "ring-slate-200",
  },
  Other: {
    icon: Package,
    label: "Other",
    accent: "text-cyan-800",
    soft: "bg-cyan-50",
    ring: "ring-cyan-200",
  },
};

export function getCategoryMeta(category: string): CategoryMeta {
  if (category in categoryMeta) {
    return categoryMeta[category as TravelItemCategory];
  }

  return categoryMeta.Other;
}
