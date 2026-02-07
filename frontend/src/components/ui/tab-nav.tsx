"use client";

import { cn } from "@/lib/utils";

interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabNavProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  variant: "horizontal" | "vertical" | "boxed";
  className?: string;
}

export function TabNav<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  variant,
  className,
}: TabNavProps<T>) {
  if (variant === "vertical") {
    return (
      <ul
        className={cn(
          "menu bg-base-100 rounded-box border border-base-200 w-full",
          className
        )}
      >
        {tabs.map((tab) => (
          <li key={tab.id}>
            <button
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge !== undefined && (
                <span className="badge badge-sm">{tab.badge}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "boxed") {
    return (
      <div className={cn("tabs tabs-boxed w-fit", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn("tab", activeTab === tab.id && "tab-active")}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <tab.icon className="w-4 h-4 mr-1.5" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="badge badge-sm ml-1.5">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // horizontal (border-bottom style)
  return (
    <div className={cn("border-b border-base-200", className)}>
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
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="badge badge-sm">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
