"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "@/components/ui/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { LabPanelDTO, LabResultDTO, InterpretationCode } from "@/types";

// Re-export for backwards compatibility
type LabResult = LabResultDTO;
type LabPanel = LabPanelDTO;

interface LabsPanelProps {
  panels: LabPanel[];
  className?: string;
}

/**
 * Check if an interpretation code indicates an abnormal result
 */
function isAbnormal(code: InterpretationCode): boolean {
  return code !== null && code !== "N";
}

/**
 * Get badge variant based on interpretation code
 */
function getInterpretationVariant(
  code: InterpretationCode
): "critical" | "warning" | "success" {
  switch (code) {
    case "HH":
    case "LL":
      return "critical";
    case "H":
    case "L":
    case "A":
      return "warning";
    default:
      return "success";
  }
}

/**
 * Get display text for interpretation code
 */
function getInterpretationDisplay(code: InterpretationCode): string {
  switch (code) {
    case "HH":
      return "CRITICAL HIGH";
    case "LL":
      return "CRITICAL LOW";
    case "H":
      return "HIGH";
    case "L":
      return "LOW";
    case "A":
      return "ABNORMAL";
    case "N":
      return "NORMAL";
    default:
      return "";
  }
}

export function LabsPanel({ panels, className }: LabsPanelProps) {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(
    new Set([panels[0]?.id])
  );
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);

  const togglePanel = (id: string) => {
    setExpandedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {panels.map((panel) => (
        <LabPanelAccordion
          key={panel.id}
          panel={panel}
          isExpanded={expandedPanels.has(panel.id)}
          onToggle={() => togglePanel(panel.id)}
          onResultClick={setSelectedResult}
        />
      ))}

      {/* Trend Modal */}
      {selectedResult && (
        <LabTrendModal
          result={selectedResult}
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}

interface LabPanelAccordionProps {
  panel: LabPanel;
  isExpanded: boolean;
  onToggle: () => void;
  onResultClick: (result: LabResult) => void;
}

function LabPanelAccordion({
  panel,
  isExpanded,
  onToggle,
  onResultClick,
}: LabPanelAccordionProps) {
  // Count abnormal results using interpretation code
  const abnormalCount = panel.results.filter((r) =>
    isAbnormal(r.interpretation?.code ?? null)
  ).length;

  return (
    <div className="border border-base-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-base-100 hover:bg-base-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold">{panel.name}</span>
          {abnormalCount > 0 && (
            <Badge variant="warning" size="sm" icon={AlertTriangle}>
              {abnormalCount} abnormal
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-base-content/60">{panel.date}</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Results */}
      {isExpanded && (
        <div className="border-t border-base-200">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs text-base-content/60">
                <th>Test</th>
                <th>Result</th>
                <th>Reference Range</th>
                <th>Interpretation</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {panel.results.map((result) => (
                <LabResultRow
                  key={result.id}
                  result={result}
                  onClick={() => onResultClick(result)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface LabResultRowProps {
  result: LabResult;
  onClick: () => void;
}

function LabResultRow({ result, onClick }: LabResultRowProps) {
  const interpretationCode = result.interpretation?.code ?? null;

  const getTrend = () => {
    if (!result.history || result.history.length < 2) return null;
    const current = result.value;
    const previous = result.history[result.history.length - 2]?.value;
    if (!previous) return null;

    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);

    if (Math.abs(diff) < 0.01) {
      return { icon: Minus, color: "text-base-content/50", label: "No change" };
    }
    if (diff > 0) {
      return {
        icon: TrendingUp,
        color:
          interpretationCode === "H" || interpretationCode === "HH"
            ? "text-error"
            : "text-success",
        label: `+${percentChange}%`,
      };
    }
    return {
      icon: TrendingDown,
      color:
        interpretationCode === "L" || interpretationCode === "LL"
          ? "text-error"
          : "text-success",
      label: `${percentChange}%`,
    };
  };

  const trend = getTrend();
  const TrendIcon = trend?.icon;

  // Get reference range values
  const refLow = result.referenceRange?.low?.value;
  const refHigh = result.referenceRange?.high?.value;

  return (
    <tr className="hover:bg-base-200 cursor-pointer" onClick={onClick}>
      <td className="font-medium">{result.testName}</td>
      <td>
        <span
          className={cn(
            "font-mono",
            (interpretationCode === "H" || interpretationCode === "HH") &&
              "text-error",
            (interpretationCode === "L" || interpretationCode === "LL") &&
              "text-warning",
            (interpretationCode === "HH" || interpretationCode === "LL") &&
              "font-bold"
          )}
        >
          {result.value} {result.unit}
        </span>
      </td>
      <td className="text-base-content/60">
        {refLow !== undefined && refHigh !== undefined
          ? `${refLow} - ${refHigh} ${result.unit}`
          : refHigh !== undefined
            ? `< ${refHigh} ${result.unit}`
            : refLow !== undefined
              ? `> ${refLow} ${result.unit}`
              : "N/A"}
      </td>
      <td>
        {isAbnormal(interpretationCode) && (
          <Badge
            variant={getInterpretationVariant(interpretationCode)}
            size="xs"
          >
            {getInterpretationDisplay(interpretationCode)}
          </Badge>
        )}
      </td>
      <td>
        {trend && TrendIcon && (
          <span className={cn("flex items-center gap-1 text-xs", trend.color)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trend.label}
          </span>
        )}
      </td>
    </tr>
  );
}

interface LabTrendModalProps {
  result: LabResult;
  isOpen: boolean;
  onClose: () => void;
}

function LabTrendModal({ result, isOpen, onClose }: LabTrendModalProps) {
  // Get reference range values
  const refLow = result.referenceRange?.low?.value;
  const refHigh = result.referenceRange?.high?.value;

  // Transform history data for chart
  const chartData = result.history
    ? result.history.map((h) => ({
        date: h.effectiveDateTime,
        value: h.value,
      }))
    : [{ date: result.date, value: result.value }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${result.testName} Trend`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Current value */}
        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
          <div>
            <p className="text-sm text-base-content/60">Latest Result</p>
            <p className="text-2xl font-bold">
              {result.value} {result.unit}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-base-content/60">Reference Range</p>
            <p className="text-lg">
              {refLow !== undefined && refHigh !== undefined
                ? `${refLow} - ${refHigh} ${result.unit}`
                : refHigh !== undefined
                  ? `< ${refHigh} ${result.unit}`
                  : refLow !== undefined
                    ? `> ${refLow} ${result.unit}`
                    : "N/A"}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              {refLow !== undefined && (
                <ReferenceLine
                  y={refLow}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{ value: "Low", fill: "#F59E0B", fontSize: 10 }}
                />
              )}
              {refHigh !== undefined && (
                <ReferenceLine
                  y={refHigh}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{ value: "High", fill: "#F59E0B", fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3B82F6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* History table */}
        {chartData.length > 1 && (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData
                  .slice()
                  .reverse()
                  .map((reading, i) => {
                    const isHigh =
                      refHigh !== undefined && reading.value > refHigh;
                    const isLow =
                      refLow !== undefined && reading.value < refLow;
                    return (
                      <tr key={i}>
                        <td>{new Date(reading.date).toLocaleDateString()}</td>
                        <td
                          className={cn(
                            "font-mono",
                            isHigh && "text-error",
                            isLow && "text-warning"
                          )}
                        >
                          {reading.value} {result.unit}
                        </td>
                        <td>
                          {isHigh && (
                            <Badge variant="warning" size="xs">
                              HIGH
                            </Badge>
                          )}
                          {isLow && (
                            <Badge variant="warning" size="xs">
                              LOW
                            </Badge>
                          )}
                          {!isHigh && !isLow && (
                            <Badge variant="success" size="xs">
                              NORMAL
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
