"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { FilterPills } from "@/components/forms/filter-pills";
import { SelectDropdown } from "@/components/forms/select-dropdown";

interface VitalReading {
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

interface VitalsChartProps {
  data: VitalReading[];
  className?: string;
}

const vitalTypes = [
  { id: "bloodPressure", label: "Blood Pressure" },
  { id: "heartRate", label: "Heart Rate" },
  { id: "temperature", label: "Temperature" },
  { id: "weight", label: "Weight" },
  { id: "respiratoryRate", label: "Respiratory Rate" },
  { id: "oxygenSaturation", label: "O2 Saturation" },
];

const timeRangeOptions = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" },
];

const referenceRanges = {
  systolic: { low: 90, high: 120, critical: 140 },
  diastolic: { low: 60, high: 80, critical: 90 },
  heartRate: { low: 60, high: 100 },
  temperature: { low: 97, high: 99 },
  oxygenSaturation: { low: 95, high: 100 },
  respiratoryRate: { low: 12, high: 20 },
};

const vitalColors = {
  systolic: "#EF4444",
  diastolic: "#F97316",
  heartRate: "#3B82F6",
  temperature: "#10B981",
  weight: "#8B5CF6",
  respiratoryRate: "#EC4899",
  oxygenSaturation: "#06B6D4",
};

export function VitalsChart({ data, className }: VitalsChartProps) {
  const [selectedVitals, setSelectedVitals] = useState<string[]>([
    "bloodPressure",
  ]);
  const [timeRange, setTimeRange] = useState("30d");

  const showBloodPressure = selectedVitals.includes("bloodPressure");
  const showHeartRate = selectedVitals.includes("heartRate");
  const showTemperature = selectedVitals.includes("temperature");
  const showWeight = selectedVitals.includes("weight");
  const showRespiratoryRate = selectedVitals.includes("respiratoryRate");
  const showOxygenSaturation = selectedVitals.includes("oxygenSaturation");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <FilterPills
          options={vitalTypes}
          selected={selectedVitals}
          onChange={setSelectedVitals}
          multiSelect
        />
        <SelectDropdown
          options={timeRangeOptions}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
              labelStyle={{ color: "#F9FAFB" }}
            />
            <Legend />

            {/* Reference lines for normal ranges */}
            {showBloodPressure && (
              <>
                <ReferenceLine
                  y={referenceRanges.systolic.high}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <ReferenceLine
                  y={referenceRanges.diastolic.high}
                  stroke="#F97316"
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
              </>
            )}

            {/* Data lines */}
            {showBloodPressure && (
              <>
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic"
                  stroke={vitalColors.systolic}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic"
                  stroke={vitalColors.diastolic}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}
            {showHeartRate && (
              <Line
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke={vitalColors.heartRate}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showTemperature && (
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke={vitalColors.temperature}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showWeight && (
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight"
                stroke={vitalColors.weight}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showRespiratoryRate && (
              <Line
                type="monotone"
                dataKey="respiratoryRate"
                name="Respiratory Rate"
                stroke={vitalColors.respiratoryRate}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {showOxygenSaturation && (
              <Line
                type="monotone"
                dataKey="oxygenSaturation"
                name="O2 Saturation"
                stroke={vitalColors.oxygenSaturation}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reference ranges legend */}
      <VitalsReferenceRanges selectedVitals={selectedVitals} />
    </div>
  );
}

function VitalsReferenceRanges({
  selectedVitals,
}: {
  selectedVitals: string[];
}) {
  const ranges = [
    {
      id: "bloodPressure",
      label: "Blood Pressure",
      normal: "90-120 / 60-80 mmHg",
      elevated: "> 120/80 mmHg",
    },
    {
      id: "heartRate",
      label: "Heart Rate",
      normal: "60-100 bpm",
      elevated: "> 100 bpm",
    },
    {
      id: "temperature",
      label: "Temperature",
      normal: "97-99°F",
      elevated: "> 99°F",
    },
    {
      id: "oxygenSaturation",
      label: "O2 Saturation",
      normal: "95-100%",
      elevated: "< 95%",
    },
  ];

  const activeRanges = ranges.filter((r) => selectedVitals.includes(r.id));

  if (activeRanges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 p-3 bg-base-200 rounded-lg text-sm">
      <span className="font-medium text-base-content/70">Normal ranges:</span>
      {activeRanges.map((range) => (
        <span key={range.id} className="text-base-content/60">
          <span className="font-medium">{range.label}:</span> {range.normal}
        </span>
      ))}
    </div>
  );
}
