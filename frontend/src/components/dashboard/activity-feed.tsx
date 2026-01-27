"use client";

import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/layout/app-layout";
import { ListItemSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  UserPlus,
  Edit,
  Eye,
  FileDown,
  Trash2,
  Activity,
  type LucideIcon,
} from "@/components/ui/icons";
import type { ActivityDTO, ActivityType } from "@/types";

// Re-export for backwards compatibility
type ActivityItem = ActivityDTO;

interface ActivityFeedProps {
  activities?: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

const activityConfig: Record<
  ActivityType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  create: {
    icon: UserPlus,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  update: {
    icon: Edit,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  view: {
    icon: Eye,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  delete: {
    icon: Trash2,
    color: "text-error",
    bgColor: "bg-error/10",
  },
  export: {
    icon: FileDown,
    color: "text-warning",
    bgColor: "bg-warning/10",
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

export function ActivityFeed({
  activities = [],
  loading = false,
  maxItems = 10,
  className,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("card bg-base-100 shadow-sm", className)}>
      <div className="card-body">
        <SectionHeader title="Recent Activity" viewAllHref="/activity" />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : displayActivities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Your FHIR operations will appear here"
            size="sm"
          />
        ) : (
          <div className="space-y-1">
            {displayActivities.map((activity, index) => (
              <ActivityFeedItem
                key={activity.id}
                activity={activity}
                isLast={index === displayActivities.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityFeedItem({
  activity,
  isLast,
}: {
  activity: ActivityItem;
  isLast: boolean;
}) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className={cn("p-1.5 rounded-full", config.bgColor)}>
          <Icon className={cn("w-3 h-3", config.color)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-base-200 my-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <p className="text-sm">
          <span className="font-medium">{activity.description}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-base-content/50">
          {activity.user && <span>{activity.user}</span>}
          {activity.user && <span>•</span>}
          <span>{formatRelativeTime(activity.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
