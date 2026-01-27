"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/forms/filter-pills";
import { FhirDate } from "@/components/fhir/fhir-date";
import {
  Activity,
  HeartPulse,
  Pill,
  TestTube,
  Stethoscope,
  FileText,
  Calendar,
  User,
  Syringe,
  ShieldAlert,
  type LucideIcon,
} from "@/components/ui/icons";
import type { TimelineEventDTO, TimelineResourceType } from "@/types";

// Re-export for backwards compatibility
type TimelineEvent = TimelineEventDTO;

interface TimelineViewProps {
  events: TimelineEvent[];
  className?: string;
}

const resourceConfig: Record<
  TimelineResourceType,
  { icon: LucideIcon; color: string; bgColor: string; label: string }
> = {
  Observation: {
    icon: Activity,
    color: "text-info",
    bgColor: "bg-info/10",
    label: "Observation",
  },
  Condition: {
    icon: HeartPulse,
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Condition",
  },
  MedicationRequest: {
    icon: Pill,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Medication",
  },
  DiagnosticReport: {
    icon: TestTube,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Lab Report",
  },
  Encounter: {
    icon: Stethoscope,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    label: "Encounter",
  },
  Procedure: {
    icon: User,
    color: "text-accent",
    bgColor: "bg-accent/10",
    label: "Procedure",
  },
  DocumentReference: {
    icon: FileText,
    color: "text-neutral",
    bgColor: "bg-neutral/10",
    label: "Document",
  },
  Immunization: {
    icon: Syringe,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Immunization",
  },
  AllergyIntolerance: {
    icon: ShieldAlert,
    color: "text-error",
    bgColor: "bg-error/10",
    label: "Allergy",
  },
};

const filterOptions = [
  { id: "all", label: "All" },
  { id: "Observation", label: "Observations" },
  { id: "Condition", label: "Conditions" },
  { id: "MedicationRequest", label: "Medications" },
  { id: "DiagnosticReport", label: "Lab Reports" },
  { id: "Encounter", label: "Encounters" },
];

export function TimelineView({ events, className }: TimelineViewProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);

  const filteredEvents = events.filter((event) => {
    if (selectedFilters.includes("all") || selectedFilters.length === 0) {
      return true;
    }
    return selectedFilters.includes(event.resourceType);
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce(
    (groups, event) => {
      const date = new Date(event.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    },
    {} as Record<string, TimelineEvent[]>
  );

  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filter */}
      <FilterPills
        options={filterOptions}
        selected={selectedFilters}
        onChange={(filters) => {
          if (filters.includes("all") && !selectedFilters.includes("all")) {
            setSelectedFilters(["all"]);
          } else if (
            filters.length > 0 &&
            filters[filters.length - 1] !== "all"
          ) {
            setSelectedFilters(filters.filter((f) => f !== "all"));
          } else if (filters.length === 0) {
            setSelectedFilters(["all"]);
          } else {
            setSelectedFilters(filters);
          }
        }}
        multiSelect
      />

      {/* Timeline */}
      <div className="space-y-8">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-base-200 rounded-lg">
                <Calendar className="w-4 h-4 text-base-content/60" />
              </div>
              <h3 className="font-semibold">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>

            {/* Events for this date */}
            <div className="ml-4 pl-4 border-l-2 border-base-200 space-y-4">
              {groupedEvents[date].map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={index === groupedEvents[date].length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-base-content/50">
          No events found for the selected filters
        </div>
      )}
    </div>
  );
}

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineItem({ event, isLast: _isLast }: TimelineItemProps) {
  const config = resourceConfig[event.resourceType];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Icon */}
      <div
        className={cn(
          "absolute -left-6 p-1.5 rounded-full ring-4 ring-base-200",
          config.bgColor
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 ml-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="ghost" size="xs">
                {config.label}
              </Badge>
              {event.status && (
                <Badge
                  variant={
                    event.status === "active"
                      ? "active"
                      : event.status === "completed"
                        ? "resolved"
                        : "ghost"
                  }
                  size="xs"
                >
                  {event.status}
                </Badge>
              )}
            </div>
            <h4 className="font-medium">{event.title}</h4>
            {event.description && (
              <p className="text-sm text-base-content/60 mt-1">
                {event.description}
              </p>
            )}
          </div>
          <FhirDate
            value={event.date}
            includeTime
            className="text-sm text-base-content/50 shrink-0"
          />
        </div>

        {/* Details */}
        {event.details && Object.keys(event.details).length > 0 && (
          <div className="mt-2 p-3 bg-base-200 rounded-lg">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(event.details).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-base-content/50">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
