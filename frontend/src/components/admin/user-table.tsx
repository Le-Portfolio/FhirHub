"use client";

import Link from "next/link";
import { ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight } from "@/components/ui/icons";
import type { KeycloakUserDTO } from "@/types/dto/user-management.dto";

interface UserTableProps {
  users: KeycloakUserDTO[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function UserTable({
  users,
  loading,
  currentPage,
  totalPages,
  total,
  onPageChange,
}: UserTableProps) {
  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-base-content/50">
        No users found
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto border border-base-200 rounded-lg">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover">
                <td>
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-base-content/50">
                    {user.username}
                  </div>
                </td>
                <td className="text-sm">{user.email}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {user.roles
                      .filter(
                        (r) =>
                          !r.startsWith("default-roles-") &&
                          r !== "offline_access" &&
                          r !== "uma_authorization"
                      )
                      .map((role) => (
                        <span
                          key={role}
                          className="badge badge-outline badge-xs"
                        >
                          {role}
                        </span>
                      ))}
                  </div>
                </td>
                <td>
                  {user.enabled ? (
                    <span className="badge badge-success badge-sm gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="badge badge-error badge-sm gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Disabled
                    </span>
                  )}
                </td>
                <td className="text-xs text-base-content/50">
                  {user.createdTimestamp
                    ? new Date(user.createdTimestamp).toLocaleDateString()
                    : "—"}
                </td>
                <td>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="btn btn-ghost btn-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-base-content/60">
            {total} users total
          </span>
          <div className="flex gap-1">
            <button
              className="btn btn-sm btn-outline"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="btn btn-sm btn-ghost">
              {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
