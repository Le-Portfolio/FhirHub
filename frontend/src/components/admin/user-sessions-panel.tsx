"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut, RefreshCw } from "@/components/ui/icons";
import { useUserManagementService } from "@/services";
import { useUserMutations } from "@/hooks/useUserMutations";
import type { KeycloakSessionDTO } from "@/types/dto/user-management.dto";

interface UserSessionsPanelProps {
  userId: string;
}

export function UserSessionsPanel({ userId }: UserSessionsPanelProps) {
  const service = useUserManagementService();
  const mutations = useUserMutations();
  const [sessions, setSessions] = useState<KeycloakSessionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await service.getUserSessions(userId);
      setSessions(data);
    } catch {
      // silently handle — user may have no sessions
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [userId, service]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleTerminateAll = useCallback(async () => {
    await mutations.terminateUserSessions(userId);
    fetchSessions();
  }, [userId, mutations, fetchSessions]);

  if (loading) {
    return <span className="loading loading-spinner loading-sm" />;
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-base-content/50 mt-2">No active sessions</p>;
  }

  return (
    <div className="mt-2">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Started</th>
              <th>Last Access</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-mono text-xs">{session.ipAddress}</td>
                <td className="text-xs">
                  {new Date(session.start).toLocaleString()}
                </td>
                <td className="text-xs">
                  {new Date(session.lastAccess).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleTerminateAll}
          disabled={mutations.loading}
          className="btn btn-error btn-xs gap-1"
        >
          <LogOut className="w-3 h-3" />
          Terminate All Sessions
        </button>
        <button
          onClick={fetchSessions}
          className="btn btn-ghost btn-xs btn-square"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
