"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import {
  ArrowLeft,
  Save,
  ShieldAlert,
  ShieldCheck,
  Key,
  LogOut,
  Lock,
} from "@/components/ui/icons";
import { useUser } from "@/hooks/useUser";
import { useUserMutations } from "@/hooks/useUserMutations";
import { UserRoleEditor } from "@/components/admin/user-role-editor";
import { UserSessionsPanel } from "@/components/admin/user-sessions-panel";
import Link from "next/link";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { data: user, loading, error, refetch } = useUser(userId);
  const mutations = useUserMutations();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form when user data loads
  if (user && !initialized) {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setInitialized(true);
  }

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    await mutations.updateUser(user.id, { firstName, lastName, email });
    refetch();
  }, [user, firstName, lastName, email, mutations, refetch]);

  const handleToggleActive = useCallback(async () => {
    if (!user) return;
    if (user.enabled) {
      await mutations.deactivateUser(user.id);
    } else {
      await mutations.reactivateUser(user.id);
    }
    refetch();
  }, [user, mutations, refetch]);

  const handlePasswordReset = useCallback(async () => {
    if (!user) return;
    await mutations.sendPasswordReset(user.id);
  }, [user, mutations]);

  const handleRequireMfa = useCallback(async () => {
    if (!user) return;
    await mutations.requireMfa(user.id);
    refetch();
  }, [user, mutations, refetch]);

  const handleForceLogout = useCallback(async () => {
    if (!user) return;
    await mutations.terminateUserSessions(user.id);
    refetch();
  }, [user, mutations, refetch]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <ShieldAlert className="w-16 h-16 text-error/50" />
          <p className="text-base-content/60">
            {error?.message ?? "User not found"}
          </p>
          <Link href="/admin/users" className="btn btn-sm btn-primary">
            Back to Users
          </Link>
        </div>
      </PageContainer>
    );
  }

  const hasMfaRequired = user.requiredActions?.includes("CONFIGURE_OTP");

  return (
    <PageContainer>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        actions={
          <Link href="/admin/users" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Profile Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input input-bordered input-sm"
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
                  />
                </div>
                <div className="form-control sm:col-span-2">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-bordered input-sm"
                  />
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={mutations.loading}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Roles</h3>
              <UserRoleEditor userId={user.id} currentRoles={user.roles} onUpdate={refetch} />
            </div>
          </div>

          {/* Sessions */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Active Sessions</h3>
              <UserSessionsPanel userId={user.id} />
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Account Status</h3>
              <div className="flex items-center gap-2 mt-2">
                {user.enabled ? (
                  <span className="badge badge-success gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="badge badge-error gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Deactivated
                  </span>
                )}
                {user.emailVerified && (
                  <span className="badge badge-info badge-outline badge-sm">
                    Email Verified
                  </span>
                )}
              </div>
              {hasMfaRequired && (
                <div className="mt-2">
                  <span className="badge badge-warning badge-sm gap-1">
                    <Lock className="w-3 h-3" />
                    MFA Setup Required
                  </span>
                </div>
              )}
              {user.createdTimestamp && (
                <p className="text-xs text-base-content/50 mt-2">
                  Created{" "}
                  {new Date(user.createdTimestamp).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">Actions</h3>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={handleToggleActive}
                  disabled={mutations.loading}
                  className={`btn btn-sm ${user.enabled ? "btn-warning" : "btn-success"}`}
                >
                  {user.enabled ? "Deactivate User" : "Reactivate User"}
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={mutations.loading}
                  className="btn btn-sm btn-outline gap-2"
                >
                  <Key className="w-4 h-4" />
                  Send Password Reset
                </button>
                <button
                  onClick={handleForceLogout}
                  disabled={mutations.loading}
                  className="btn btn-sm btn-outline gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Force Logout
                </button>
                {!hasMfaRequired && (
                  <button
                    onClick={handleRequireMfa}
                    disabled={mutations.loading}
                    className="btn btn-sm btn-outline gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Require MFA Setup
                  </button>
                )}
              </div>
              {mutations.error && (
                <p className="text-error text-xs mt-2">{mutations.error.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
