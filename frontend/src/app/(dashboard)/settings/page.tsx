"use client";

import { useState, useEffect } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import {
  Settings,
  User,
  Bell,
  ShieldCheck,
  Database,
  Lock,
  Mail,
  Activity,
  FileDown,
  AlertCircle,
  Check,
} from "@/components/ui/icons";
import { useAuth } from "@/providers/auth-provider";

type SettingsTab = "profile" | "appearance" | "notifications" | "security" | "fhir";

const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "fhir", label: "FHIR Settings", icon: Database },
];

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [key]);

  const setAndPersist = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setAndPersist];
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user } = useAuth();

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and application configuration"
        icon={Settings}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab navigation */}
        <div className="lg:w-56 shrink-0">
          <ul className="menu bg-base-100 rounded-box border border-base-200 w-full">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <div className="bg-base-100 rounded-box border border-base-200 p-6">
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "appearance" && <AppearanceTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "fhir" && <FhirSettingsTab />}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// --- Profile Tab ---

function ProfileTab({ user }: { user: { id: string; email: string; firstName: string; lastName: string; fullName: string; roles: string[] } | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "Guest");
  const [lastName, setLastName] = useState(user?.lastName || "User");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profile Information</h2>
        {!isEditing ? (
          <button className="btn btn-sm btn-outline" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="btn btn-sm btn-ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        )}
      </div>

      {saved && (
        <div className="alert alert-success py-2">
          <Check className="w-4 h-4" />
          <span>Profile updated successfully</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
          {(user?.firstName?.[0] || "G").toUpperCase()}{(user?.lastName?.[0] || "U").toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.fullName || "Guest User"}</p>
          <p className="text-sm text-base-content/60">{user?.email || "guest@fhirhub.demo"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">First Name</span></label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={!isEditing}
            className="input input-bordered"
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Last Name</span></label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={!isEditing}
            className="input input-bordered"
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Email</span></label>
          <input
            type="email"
            value={user?.email || "guest@fhirhub.demo"}
            disabled
            className="input input-bordered"
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">User ID</span></label>
          <input
            type="text"
            value={user?.id || "guest-user"}
            disabled
            className="input input-bordered font-mono text-sm"
          />
        </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Roles</span></label>
        <div className="flex flex-wrap gap-2">
          {(user?.roles || ["admin", "practitioner"]).map((role) => (
            <span key={role} className="badge badge-outline">{role}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Appearance Tab ---

function AppearanceTab() {
  const [theme, setTheme] = useLocalStorage<string>("fhirhub-theme", "system");
  const [compactMode, setCompactMode] = useLocalStorage<boolean>("fhirhub-compact", false);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Appearance</h2>

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">Theme</span></label>
        <p className="text-sm text-base-content/60 mb-3">Select your preferred color scheme</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", desc: "Clean white interface" },
            { value: "dark", label: "Dark", desc: "Easy on the eyes" },
            { value: "system", label: "System", desc: "Match OS setting" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                theme === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-base-200 hover:border-base-300"
              }`}
            >
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-base-content/60 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={compactMode}
            onChange={(e) => setCompactMode(e.target.checked)}
          />
          <div>
            <span className="label-text font-medium">Compact Mode</span>
            <p className="text-xs text-base-content/60 mt-0.5">Reduce spacing and padding throughout the interface</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// --- Notifications Tab ---

function NotificationsTab() {
  const [clinicalAlerts, setClinicalAlerts] = useLocalStorage("fhirhub-notif-clinical", true);
  const [exportNotifs, setExportNotifs] = useLocalStorage("fhirhub-notif-exports", true);
  const [systemUpdates, setSystemUpdates] = useLocalStorage("fhirhub-notif-system", false);
  const [securityAlerts, setSecurityAlerts] = useLocalStorage("fhirhub-notif-security", true);

  const toggles = [
    {
      label: "Clinical Alerts",
      desc: "Receive notifications for abnormal lab results, critical vitals, and care plan updates",
      icon: Activity,
      value: clinicalAlerts,
      onChange: setClinicalAlerts,
    },
    {
      label: "Export Completions",
      desc: "Get notified when bulk FHIR exports are ready for download",
      icon: FileDown,
      value: exportNotifs,
      onChange: setExportNotifs,
    },
    {
      label: "System Updates",
      desc: "Receive notifications about system maintenance, updates, and new features",
      icon: AlertCircle,
      value: systemUpdates,
      onChange: setSystemUpdates,
    },
    {
      label: "Security Alerts",
      desc: "Get alerts for new logins, password changes, and suspicious activity",
      icon: ShieldCheck,
      value: securityAlerts,
      onChange: setSecurityAlerts,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Email Notifications</h2>
      <p className="text-sm text-base-content/60">Choose which email notifications you&apos;d like to receive</p>

      <div className="space-y-4">
        {toggles.map((toggle) => (
          <div
            key={toggle.label}
            className="flex items-center justify-between p-4 rounded-lg border border-base-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-base-200 rounded-lg">
                <toggle.icon className="w-4 h-4 text-base-content/70" />
              </div>
              <div>
                <p className="font-medium text-sm">{toggle.label}</p>
                <p className="text-xs text-base-content/60 mt-0.5">{toggle.desc}</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={toggle.value}
              onChange={(e) => toggle.onChange(e.target.checked)}
            />
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">Notification Email</span></label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="email"
              placeholder="your@email.com"
              defaultValue="guest@fhirhub.demo"
              className="input input-bordered w-full pl-10"
            />
          </div>
          <button className="btn btn-primary">Update</button>
        </div>
      </div>
    </div>
  );
}

// --- Security Tab ---

function SecurityTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Security</h2>

      {/* Password */}
      <div className="p-4 rounded-lg border border-base-200 space-y-3">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-base-content/70" />
          <div>
            <p className="font-medium">Change Password</p>
            <p className="text-sm text-base-content/60">Update your authentication password</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="form-control">
            <input type="password" placeholder="Current password" className="input input-bordered input-sm" disabled />
          </div>
          <div className="form-control">
            <input type="password" placeholder="New password" className="input input-bordered input-sm" disabled />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-base-content/50">
          <AlertCircle className="w-4 h-4" />
          <span>Password changes are managed through your identity provider</span>
        </div>
      </div>

      {/* MFA */}
      <div className="p-4 rounded-lg border border-base-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-base-content/60">Add an extra layer of security to your account</p>
            </div>
          </div>
          <span className="badge badge-ghost">Not Configured</span>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="space-y-3">
        <h3 className="font-medium">Active Sessions</h3>
        <div className="overflow-x-auto border border-base-200 rounded-lg">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Device</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-sm">Chrome on Linux</td>
                <td className="font-mono text-xs">10.0.1.42</td>
                <td className="text-xs">Just now</td>
                <td><span className="badge badge-success badge-sm">Current</span></td>
              </tr>
              <tr>
                <td className="text-sm">Firefox on macOS</td>
                <td className="font-mono text-xs">10.0.2.85</td>
                <td className="text-xs">2 hours ago</td>
                <td><span className="badge badge-ghost badge-sm">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- FHIR Settings Tab ---

function FhirSettingsTab() {
  const [fhirUrl, setFhirUrl] = useLocalStorage("fhirhub-fhir-url", "https://fhir.fhirhub.demo/r4");
  const [format, setFormat] = useLocalStorage("fhirhub-fhir-format", "json");
  const [pageSize, setPageSize] = useLocalStorage("fhirhub-fhir-page-size", "20");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">FHIR Configuration</h2>
        <button className="btn btn-sm btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="alert alert-success py-2">
          <Check className="w-4 h-4" />
          <span>FHIR settings saved successfully</span>
        </div>
      )}

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">Default FHIR Server URL</span></label>
        <p className="text-sm text-base-content/60 mb-2">The base URL for FHIR API requests</p>
        <div className="relative">
          <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            type="url"
            value={fhirUrl}
            onChange={(e) => setFhirUrl(e.target.value)}
            className="input input-bordered w-full pl-10 font-mono text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Preferred Format</span></label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="select select-bordered"
          >
            <option value="json">JSON (application/fhir+json)</option>
            <option value="xml">XML (application/fhir+xml)</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Default Page Size</span></label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            className="select select-bordered"
          >
            <option value="10">10 resources</option>
            <option value="20">20 resources</option>
            <option value="50">50 resources</option>
            <option value="100">100 resources</option>
          </select>
        </div>
      </div>

      <div className="divider" />

      <div className="p-4 rounded-lg bg-base-200/50">
        <h3 className="font-medium text-sm mb-2">FHIR Server Capabilities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {["R4", "JSON", "XML", "Batch", "Search", "History", "Bulk Export", "SMART"].map((cap) => (
            <span key={cap} className="flex items-center gap-1">
              <Check className="w-3 h-3 text-success" />
              {cap}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
