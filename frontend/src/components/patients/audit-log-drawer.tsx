"use client";

import { Drawer } from "@/components/ui/modal";
import {
  History,
  User,
  Eye,
  Edit,
  FileText,
  Shield,
} from "@/components/ui/icons";

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

// Placeholder audit events - in a real app, these would come from an API
const mockAuditEvents = [
  {
    id: "1",
    action: "view",
    description: "Viewed patient record",
    user: "Dr. Sarah Chen",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    action: "edit",
    description: "Updated medications list",
    user: "Dr. Sarah Chen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    action: "view",
    description: "Viewed lab results",
    user: "Nurse Johnson",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "4",
    action: "export",
    description: "Exported patient summary",
    user: "Dr. Michael Ross",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "5",
    action: "access",
    description: "Accessed via emergency override",
    user: "Dr. Emergency",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

const actionIcons = {
  view: Eye,
  edit: Edit,
  export: FileText,
  access: Shield,
};

const actionColors = {
  view: "text-info",
  edit: "text-warning",
  export: "text-success",
  access: "text-error",
};

export function AuditLogDrawer({
  isOpen,
  onClose,
  patientName,
}: AuditLogDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Audit Log" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-info/10 rounded-lg text-sm">
          <History className="w-4 h-4 text-info" />
          <span>Access history for {patientName}</span>
        </div>

        <div className="space-y-3">
          {mockAuditEvents.map((event) => {
            const Icon =
              actionIcons[event.action as keyof typeof actionIcons] || Eye;
            const colorClass =
              actionColors[event.action as keyof typeof actionColors] ||
              "text-base-content";

            return (
              <div
                key={event.id}
                className="flex gap-4 p-4 bg-base-200 rounded-lg"
              >
                <div className={`p-2 rounded-lg bg-base-100 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{event.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-base-content/60">
                    <User className="w-3.5 h-3.5" />
                    <span>{event.user}</span>
                    <span className="text-base-content/40">·</span>
                    <span>{formatRelativeTime(event.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-base-200 rounded-lg text-center text-sm text-base-content/60">
          <p>Showing recent activity</p>
          <p className="mt-1">Full audit history coming soon</p>
        </div>
      </div>
    </Drawer>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
