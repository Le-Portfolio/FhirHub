"use client";

import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/common/stats-card";
import { StatsCardSkeleton } from "@/components/ui/loading-skeleton";
import {
  Users,
  Activity,
  HeartPulse,
  Pill,
  type LucideIcon,
} from "@/components/ui/icons";

interface Metric {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}

interface MetricsRowProps {
  metrics?: Metric[];
  loading?: boolean;
  className?: string;
}

// Default metrics for dashboard
const defaultMetrics: Metric[] = [
  {
    title: "Total Patients",
    value: 0,
    icon: Users,
    iconColor: "text-primary",
    iconBgColor: "bg-primary/10",
  },
  {
    title: "Observations",
    value: 0,
    icon: Activity,
    iconColor: "text-info",
    iconBgColor: "bg-info/10",
  },
  {
    title: "Conditions",
    value: 0,
    icon: HeartPulse,
    iconColor: "text-warning",
    iconBgColor: "bg-warning/10",
  },
  {
    title: "Medications",
    value: 0,
    icon: Pill,
    iconColor: "text-success",
    iconBgColor: "bg-success/10",
  },
];

export function MetricsRow({
  metrics = defaultMetrics,
  loading = false,
  className,
}: MetricsRowProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          className
        )}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {metrics.map((metric, index) => (
        <StatsCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          trend={metric.trend}
          iconColor={metric.iconColor}
          iconBgColor={metric.iconBgColor}
        />
      ))}
    </div>
  );
}
