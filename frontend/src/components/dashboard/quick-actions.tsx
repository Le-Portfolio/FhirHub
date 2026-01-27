"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  FileDown,
  type LucideIcon,
} from "@/components/ui/icons";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "accent";
}

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    label: "Add Patient",
    description: "Register a new patient",
    href: "/patients/new",
    icon: UserPlus,
    variant: "primary",
  },
  {
    label: "Start Export",
    description: "Bulk export FHIR data",
    href: "/export",
    icon: FileDown,
    variant: "accent",
  },
];

const variantStyles = {
  primary:
    "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10",
  secondary: "border-base-200 hover:border-primary/50 hover:bg-base-200",
  accent: "border-accent/20 hover:border-accent bg-accent/5 hover:bg-accent/10",
};

const iconVariantStyles = {
  primary: "text-primary bg-primary/10",
  secondary: "text-base-content/70 bg-base-200",
  accent: "text-accent bg-accent/10",
};

export function QuickActions({
  actions = defaultActions,
  className,
}: QuickActionsProps) {
  return (
    <div className={cn("card bg-base-100 shadow-sm", className)}>
      <div className="card-body">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                variantStyles[action.variant || "secondary"]
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  iconVariantStyles[action.variant || "secondary"]
                )}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-base-content/60 truncate">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact button variant for header/toolbar
export function QuickActionButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link href="/patients/new" className="btn btn-primary btn-sm gap-2">
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Patient</span>
      </Link>
      <Link href="/export" className="btn btn-ghost btn-sm gap-2">
        <FileDown className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </Link>
    </div>
  );
}
