"use client";

import { useState, useCallback, useEffect } from "react";
import { X } from "@/components/ui/icons";
import { useUserMutations } from "@/hooks/useUserMutations";
import { useUserManagementService } from "@/services";
import type { KeycloakRoleDTO } from "@/types/dto/user-management.dto";

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const mutations = useUserMutations();
  const service = useUserManagementService();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [sendInvitation, setSendInvitation] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<KeycloakRoleDTO[]>([]);

  useEffect(() => {
    service.getAvailableRoles().then(setAvailableRoles).catch(() => {});
  }, [service]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await mutations.createUser({
        email,
        firstName,
        lastName,
        roles: selectedRoles,
        sendInvitation,
      });
      if (result) {
        onSuccess();
      }
    },
    [email, firstName, lastName, selectedRoles, sendInvitation, mutations, onSuccess]
  );

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const roleDescriptions: Record<string, string> = {
    admin: "Full system access, manage users and settings",
    practitioner: "Read/write patient data, clinical workflows",
    nurse: "Read/write vitals, read-only medications and conditions",
    front_desk: "Read patient demographics only",
    patient: "Read own data only",
    api_client: "Service account for integrations",
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg">Invite New User</h3>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input input-bordered input-sm"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Last Name</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input input-bordered input-sm"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered input-sm"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Roles</span>
            </label>
            <div className="space-y-2">
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
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="label-text">Send invitation email</span>
            </label>
          </div>

          {mutations.error && (
            <div className="alert alert-error alert-sm">
              <span className="text-sm">{mutations.error.message}</span>
            </div>
          )}

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.loading}
              className="btn btn-primary btn-sm"
            >
              {mutations.loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Create & Invite"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
