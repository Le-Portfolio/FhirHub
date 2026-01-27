"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserMutations } from "@/hooks/useUserMutations";
import { useUserManagementService } from "@/services";
import { Save } from "@/components/ui/icons";
import type { KeycloakRoleDTO } from "@/types/dto/user-management.dto";

interface UserRoleEditorProps {
  userId: string;
  currentRoles: string[];
  onUpdate: () => void;
}

const roleDescriptions: Record<string, string> = {
  admin: "Full system access, manage users and settings",
  practitioner: "Read/write patient data, clinical workflows, exports",
  nurse: "Read/write vitals, read-only medications/conditions/labs",
  front_desk: "Read patient demographics only",
  patient: "Read own data only, download own records",
  api_client: "Service account for integrations",
};

export function UserRoleEditor({ userId, currentRoles, onUpdate }: UserRoleEditorProps) {
  const mutations = useUserMutations();
  const service = useUserManagementService();
  const [availableRoles, setAvailableRoles] = useState<KeycloakRoleDTO[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    service.getAvailableRoles().then(setAvailableRoles).catch(() => {});
  }, [service]);

  useEffect(() => {
    setSelectedRoles(currentRoles);
    setDirty(false);
  }, [currentRoles]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role];
      setDirty(true);
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    await mutations.assignRoles(userId, { roles: selectedRoles });
    setDirty(false);
    onUpdate();
  }, [userId, selectedRoles, mutations, onUpdate]);

  return (
    <div>
      <div className="space-y-2 mt-2">
        {availableRoles.map((role) => (
          <label
            key={role.name}
            className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-base-200"
          >
            <input
              type="checkbox"
              checked={selectedRoles.includes(role.name)}
              onChange={() => toggleRole(role.name)}
              className="checkbox checkbox-sm checkbox-primary mt-0.5"
            />
            <div>
              <span className="font-medium text-sm">{role.name}</span>
              <p className="text-xs text-base-content/50">
                {roleDescriptions[role.name] || role.description || ""}
              </p>
            </div>
          </label>
        ))}
      </div>
      {dirty && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={mutations.loading}
            className="btn btn-primary btn-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {mutations.loading ? "Saving..." : "Save Roles"}
          </button>
        </div>
      )}
      {mutations.error && (
        <p className="text-error text-xs mt-2">{mutations.error.message}</p>
      )}
    </div>
  );
}
