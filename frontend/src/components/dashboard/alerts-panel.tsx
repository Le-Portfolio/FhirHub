"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { ListItemSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
  Bell,
} from "@/components/ui/icons";
import type { AlertDTO, AlertPriority } from "@/types";

// Re-export for backwards compatibility
type Alert = AlertDTO;

interface AlertsPanelProps {
  alerts?: Alert[];
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

const priorityConfig: Record<
  AlertPriority,
  { icon: typeof AlertCircle; color: string; bgColor: string }
> = {
  critical: {
    icon: AlertCircle,
    color: "text-error",
    bgColor: "bg-error/10",
  },
  high: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  medium: {
    icon: Info,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  low: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
  },
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function AlertsPanel({
  alerts = [],
  loading = false,
  maxItems = 5,
  className,
}: AlertsPanelProps) {
  // Sort by priority (critical first) and then by timestamp
  const sortedAlerts = [...alerts]
    .filter((a) => a.status === "active")
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, maxItems);

  const criticalCount = alerts.filter(
    (a) => a.priority === "critical" && a.status === "active"
  ).length;

  return (
    <div className={cn("card bg-base-100 shadow-sm", className)}>
      <div className="card-body">
        <SectionHeader
          title="Clinical Alerts"
          viewAllHref="/alerts"
          actions={
            criticalCount > 0 && (
              <Badge variant="critical" size="sm">
                {criticalCount} Critical
              </Badge>
            )
          }
        />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: maxItems }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : sortedAlerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No active alerts"
            description="All clinical alerts have been resolved"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {sortedAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertItem({ alert }: { alert: Alert }) {
  const config = priorityConfig[alert.priority];
  const Icon = config.icon;

  return (
    <Link
      href={
        alert.patientId ? `/patients/${alert.patientId}` : `/alerts/${alert.id}`
      }
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors"
    >
      <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{alert.title}</p>
          <Badge
            variant={
              alert.priority === "critical"
                ? "critical"
                : alert.priority === "high"
                  ? "warning"
                  : "ghost"
            }
            size="xs"
          >
            {alert.priority}
          </Badge>
        </div>
        {alert.description && (
          <p className="text-xs text-base-content/60 line-clamp-1 mt-0.5">
            {alert.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-base-content/50">
          {alert.patientName && <span>{alert.patientName}</span>}
          {alert.patientName && <span>•</span>}
          <span>{formatRelativeTime(alert.timestamp)}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-base-content/40 shrink-0 mt-1" />
    </Link>
  );
}
