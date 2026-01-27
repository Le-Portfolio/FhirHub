"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Server,
  Database,
  Wifi,
  Clock,
  RefreshCw,
} from "@/components/ui/icons";

type StatusLevel = "healthy" | "degraded" | "down" | "unknown";

interface ServiceStatus {
  name: string;
  status: StatusLevel;
  latency?: number;
  lastCheck?: string;
  message?: string;
}

interface SystemStatusProps {
  services?: ServiceStatus[];
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const statusConfig: Record<
  StatusLevel,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  healthy: {
    icon: CheckCircle,
    color: "text-success",
    label: "Healthy",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-warning",
    label: "Degraded",
  },
  down: {
    icon: AlertCircle,
    color: "text-error",
    label: "Down",
  },
  unknown: {
    icon: AlertCircle,
    color: "text-base-content/50",
    label: "Unknown",
  },
};

const defaultServices: ServiceStatus[] = [
  { name: "FHIR Server", status: "healthy", latency: 45 },
  { name: "Database", status: "healthy", latency: 12 },
  { name: "Auth Service", status: "healthy", latency: 23 },
];

export function SystemStatus({
  services = defaultServices,
  loading = false,
  onRefresh,
  className,
}: SystemStatusProps) {
  const overallStatus = services.every((s) => s.status === "healthy")
    ? "healthy"
    : services.some((s) => s.status === "down")
      ? "down"
      : "degraded";

  const OverallIcon = statusConfig[overallStatus].icon;

  return (
    <div className={cn("card bg-base-100 shadow-sm", className)}>
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">System Status</h3>
            <span
              className={cn(
                "flex items-center gap-1 text-sm",
                statusConfig[overallStatus].color
              )}
            >
              <OverallIcon className="w-4 h-4" />
              {statusConfig[overallStatus].label}
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Refresh status"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          )}
        </div>

        {/* Services list */}
        <div className="space-y-2">
          {services.map((service, index) => (
            <ServiceStatusRow key={index} service={service} />
          ))}
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-base-200 text-xs text-base-content/50">
          <Clock className="w-3 h-3" />
          <span>Last checked: Just now</span>
        </div>
      </div>
    </div>
  );
}

function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("server") || lowerName.includes("fhir")) {
    return <Server className={className} />;
  }
  if (lowerName.includes("database") || lowerName.includes("db")) {
    return <Database className={className} />;
  }
  return <Wifi className={className} />;
}

function ServiceStatusRow({ service }: { service: ServiceStatus }) {
  const config = statusConfig[service.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <ServiceIcon
          name={service.name}
          className="w-4 h-4 text-base-content/50"
        />
        <span className="text-sm">{service.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {service.latency !== undefined && (
          <span className="text-xs text-base-content/50">
            {service.latency}ms
          </span>
        )}
        <span className={cn("flex items-center gap-1 text-xs", config.color)}>
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{config.label}</span>
        </span>
      </div>
    </div>
  );
}

// Compact inline status indicator
export function SystemStatusIndicator({
  status = "healthy",
  className,
}: {
  status?: StatusLevel;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn("flex items-center gap-1 text-sm", config.color, className)}
      title={`System ${config.label}`}
    >
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </span>
  );
}
