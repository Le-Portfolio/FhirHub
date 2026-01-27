"use client";

interface AuditLogTableProps {
  events: unknown[];
  loading: boolean;
  tab: "user" | "admin";
}

interface UserEvent {
  time?: number;
  type?: string;
  userId?: string;
  ipAddress?: string;
  details?: Record<string, string>;
  error?: string;
}

interface AdminEvent {
  time?: number;
  operationType?: string;
  resourceType?: string;
  resourcePath?: string;
  authDetails?: {
    realmId?: string;
    userId?: string;
    ipAddress?: string;
  };
}

export function AuditLogTable({ events, loading, tab }: AuditLogTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-base-content/50">
        No events found
      </div>
    );
  }

  if (tab === "user") {
    const userEvents = events as UserEvent[];
    return (
      <div className="overflow-x-auto border border-base-200 rounded-lg">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>User ID</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {userEvents.map((event, i) => (
              <tr key={i}>
                <td className="text-xs">
                  {event.time ? new Date(event.time).toLocaleString() : "—"}
                </td>
                <td>
                  <span
                    className={`badge badge-sm ${
                      event.type?.includes("ERROR")
                        ? "badge-error"
                        : event.type === "LOGIN"
                          ? "badge-success"
                          : event.type === "LOGOUT"
                            ? "badge-info"
                            : "badge-ghost"
                    }`}
                  >
                    {event.type || "—"}
                  </span>
                </td>
                <td className="font-mono text-xs max-w-[120px] truncate">
                  {event.userId || "—"}
                </td>
                <td className="font-mono text-xs">{event.ipAddress || "—"}</td>
                <td className="text-xs max-w-[200px] truncate">
                  {event.error || (event.details ? JSON.stringify(event.details) : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Admin events tab
  const adminEvents = events as AdminEvent[];
  return (
    <div className="overflow-x-auto border border-base-200 rounded-lg">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Time</th>
            <th>Operation</th>
            <th>Resource Type</th>
            <th>Resource Path</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {adminEvents.map((event, i) => (
            <tr key={i}>
              <td className="text-xs">
                {event.time ? new Date(event.time).toLocaleString() : "—"}
              </td>
              <td>
                <span className="badge badge-sm badge-outline">
                  {event.operationType || "—"}
                </span>
              </td>
              <td className="text-xs">{event.resourceType || "—"}</td>
              <td className="font-mono text-xs max-w-[200px] truncate">
                {event.resourcePath || "—"}
              </td>
              <td className="font-mono text-xs">
                {event.authDetails?.ipAddress || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
