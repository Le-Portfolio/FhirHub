"use client";

import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "@/components/ui/icons";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  description?: string;
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: StatsCardProps) {
  return (
    <div className={cn("card bg-base-100 shadow-sm", className)}>
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-4">
          {Icon && (
            <div className={cn("p-3 rounded-lg", iconBgColor)}>
              <Icon className={cn("w-6 h-6", iconColor)} />
            </div>
          )}
          <div className="flex-1 text-right">
            <p className="text-sm text-base-content/60 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>

        {(trend || description) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.isPositive !== false ? "text-success" : "text-error"
                )}
              >
                {trend.isPositive !== false ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-base-content/50 font-normal">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
            {description && (
              <p className="text-sm text-base-content/50">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact variant for dashboards
interface CompactStatsProps {
  items: Array<{
    label: string;
    value: string | number;
    change?: number;
  }>;
  className?: string;
}

export function CompactStats({ items, className }: CompactStatsProps) {
  return (
    <div className={cn("flex gap-6", className)}>
      {items.map((item, index) => (
        <div key={index} className="text-center">
          <p className="text-2xl font-bold">{item.value}</p>
          <p className="text-sm text-base-content/60">{item.label}</p>
          {item.change !== undefined && (
            <p
              className={cn(
                "text-xs font-medium",
                item.change >= 0 ? "text-success" : "text-error"
              )}
            >
              {item.change >= 0 ? "+" : ""}
              {item.change}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
