"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  TestTube,
  HeartPulse,
  Pill,
  Clock,
} from "@/components/ui/icons";

export type PatientTab =
  | "overview"
  | "vitals"
  | "labs"
  | "conditions"
  | "medications"
  | "timeline";

interface PatientTabsProps {
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  className?: string;
}

const tabs: Array<{
  id: PatientTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "vitals", label: "Vitals", icon: Activity },
  { id: "labs", label: "Labs", icon: TestTube },
  { id: "conditions", label: "Conditions", icon: HeartPulse },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "timeline", label: "Timeline", icon: Clock },
];

export function PatientTabs({
  activeTab,
  onTabChange,
  className,
}: PatientTabsProps) {
  return (
    <div
      className={cn(
        "border-b border-base-200 bg-base-100 px-4 md:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex overflow-x-auto -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-base-content/60 hover:text-base-content hover:border-base-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
