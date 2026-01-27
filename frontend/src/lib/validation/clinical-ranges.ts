/**
 * Clinical reference ranges for vital signs validation.
 * Ranges are based on standard adult clinical guidelines.
 */

export type WarningLevel = "normal" | "warning" | "critical";

export interface VitalRange {
  min: number;
  max: number;
  warningLow: number;
  warningHigh: number;
  criticalLow: number;
  criticalHigh: number;
  unit: string;
  normalRange: string;
}

export const clinicalRanges = {
  systolic: {
    min: 40,
    max: 250,
    warningLow: 90,
    warningHigh: 140,
    criticalLow: 70,
    criticalHigh: 180,
    unit: "mmHg",
    normalRange: "90-140 mmHg",
  },
  diastolic: {
    min: 20,
    max: 150,
    warningLow: 60,
    warningHigh: 90,
    criticalLow: 40,
    criticalHigh: 120,
    unit: "mmHg",
    normalRange: "60-90 mmHg",
  },
  heartRate: {
    min: 30,
    max: 250,
    warningLow: 60,
    warningHigh: 100,
    criticalLow: 40,
    criticalHigh: 150,
    unit: "bpm",
    normalRange: "60-100 bpm",
  },
  temperature: {
    min: 90,
    max: 110,
    warningLow: 97,
    warningHigh: 99.5,
    criticalLow: 95,
    criticalHigh: 104,
    unit: "°F",
    normalRange: "97-99.5 °F",
  },
  respiratoryRate: {
    min: 4,
    max: 60,
    warningLow: 12,
    warningHigh: 20,
    criticalLow: 8,
    criticalHigh: 30,
    unit: "/min",
    normalRange: "12-20 /min",
  },
  oxygenSaturation: {
    min: 50,
    max: 100,
    warningLow: 95,
    warningHigh: 100,
    criticalLow: 90,
    criticalHigh: 100,
    unit: "%",
    normalRange: "95-100%",
  },
  weight: {
    min: 1,
    max: 1000,
    warningLow: 0,
    warningHigh: 1000,
    criticalLow: 0,
    criticalHigh: 1000,
    unit: "lbs",
    normalRange: "N/A",
  },
} as const satisfies Record<string, VitalRange>;

export type VitalType = keyof typeof clinicalRanges;

/**
 * Evaluates a vital sign value and returns the warning level.
 */
export function evaluateVital(
  vitalType: VitalType,
  value: number
): WarningLevel {
  const range = clinicalRanges[vitalType];

  // For oxygen saturation, we only care about low values
  if (vitalType === "oxygenSaturation") {
    if (value < range.criticalLow) return "critical";
    if (value < range.warningLow) return "warning";
    return "normal";
  }

  // For weight, no warning/critical ranges
  if (vitalType === "weight") {
    return "normal";
  }

  // For other vitals, check both low and high
  if (value < range.criticalLow || value > range.criticalHigh)
    return "critical";
  if (value < range.warningLow || value > range.warningHigh) return "warning";
  return "normal";
}

/**
 * Gets the appropriate CSS classes for a warning level.
 */
export function getWarningClasses(level: WarningLevel): string {
  switch (level) {
    case "critical":
      return "border-error text-error bg-error/10";
    case "warning":
      return "border-warning text-warning bg-warning/10";
    default:
      return "";
  }
}

/**
 * Gets the badge classes for a warning level.
 */
export function getWarningBadgeClasses(level: WarningLevel): string {
  switch (level) {
    case "critical":
      return "badge-error";
    case "warning":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
}

/**
 * Generates a warning message for a vital sign.
 */
export function getWarningMessage(
  vitalType: VitalType,
  value: number,
  level: WarningLevel
): string | null {
  if (level === "normal") return null;

  const range = clinicalRanges[vitalType];
  const vitalNames: Record<VitalType, string> = {
    systolic: "Systolic BP",
    diastolic: "Diastolic BP",
    heartRate: "Heart rate",
    temperature: "Temperature",
    respiratoryRate: "Respiratory rate",
    oxygenSaturation: "Oxygen saturation",
    weight: "Weight",
  };

  const name = vitalNames[vitalType];
  const severity =
    level === "critical" ? "critically abnormal" : "outside normal range";

  return `${name} ${value} ${range.unit} is ${severity}. Normal: ${range.normalRange}`;
}
