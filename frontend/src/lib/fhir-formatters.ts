/**
 * FHIR Data Formatters
 * Utilities for formatting FHIR resource data for display
 */

import { formatDistanceToNow, format, parseISO, isValid } from "date-fns";

// Types for FHIR data structures
interface FhirHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

interface FhirAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface FhirQuantity {
  value?: number;
  comparator?: string;
  unit?: string;
  system?: string;
  code?: string;
}

interface FhirCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

interface FhirPeriod {
  start?: string;
  end?: string;
}

interface FhirContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
}

interface FhirIdentifier {
  use?: string;
  type?: FhirCodeableConcept;
  system?: string;
  value?: string;
}

/**
 * Format a FHIR date/dateTime string
 */
export function formatFhirDate(
  dateString: string | undefined | null,
  options: {
    includeTime?: boolean;
    relative?: boolean;
    fallback?: string;
  } = {}
): string {
  const { includeTime = false, relative = false, fallback = "-" } = options;

  if (!dateString) return fallback;

  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return fallback;

    if (relative) {
      return formatDistanceToNow(date, { addSuffix: true });
    }

    if (includeTime) {
      return format(date, "MMM d, yyyy h:mm a");
    }

    return format(date, "MMM d, yyyy");
  } catch {
    return fallback;
  }
}

/**
 * Format a FHIR HumanName
 */
export function formatPatientName(
  name: FhirHumanName | FhirHumanName[] | undefined | null,
  options: {
    format?: "full" | "short" | "formal";
    fallback?: string;
  } = {}
): string {
  const { format: nameFormat = "full", fallback = "Unknown" } = options;

  if (!name) return fallback;

  // Get the primary name (prefer 'official', then first in array)
  const names = Array.isArray(name) ? name : [name];
  const primaryName =
    names.find((n) => n.use === "official") ||
    names.find((n) => n.use === "usual") ||
    names[0];

  if (!primaryName) return fallback;

  // If text is provided, use it
  if (primaryName.text) return primaryName.text;

  const given = primaryName.given?.join(" ") || "";
  const family = primaryName.family || "";
  const prefix = primaryName.prefix?.join(" ") || "";
  const suffix = primaryName.suffix?.join(" ") || "";

  switch (nameFormat) {
    case "short":
      return given.split(" ")[0] || family || fallback;
    case "formal":
      return (
        [prefix, given, family, suffix].filter(Boolean).join(" ") || fallback
      );
    case "full":
    default:
      return [given, family].filter(Boolean).join(" ") || fallback;
  }
}

/**
 * Format a FHIR Address
 */
export function formatAddress(
  address: FhirAddress | FhirAddress[] | undefined | null,
  options: {
    format?: "full" | "short" | "city-state";
    fallback?: string;
  } = {}
): string {
  const { format: addressFormat = "full", fallback = "-" } = options;

  if (!address) return fallback;

  // Get the primary address
  const addresses = Array.isArray(address) ? address : [address];
  const primaryAddress =
    addresses.find((a) => a.use === "home") ||
    addresses.find((a) => a.use === "work") ||
    addresses[0];

  if (!primaryAddress) return fallback;

  // If text is provided, use it
  if (primaryAddress.text) return primaryAddress.text;

  const { line, city, state, postalCode, country } = primaryAddress;

  switch (addressFormat) {
    case "short":
      return [city, state].filter(Boolean).join(", ") || fallback;
    case "city-state":
      return [city, state, postalCode].filter(Boolean).join(", ") || fallback;
    case "full":
    default:
      const street = line?.join(", ") || "";
      const cityLine = [city, state, postalCode].filter(Boolean).join(", ");
      return [street, cityLine, country].filter(Boolean).join("\n") || fallback;
  }
}

/**
 * Format a FHIR Quantity
 */
export function formatQuantity(
  quantity: FhirQuantity | undefined | null,
  options: {
    precision?: number;
    fallback?: string;
  } = {}
): string {
  const { precision = 2, fallback = "-" } = options;

  if (!quantity || quantity.value === undefined) return fallback;

  const value =
    typeof quantity.value === "number"
      ? Number(quantity.value.toFixed(precision))
      : quantity.value;

  const comparator = quantity.comparator || "";
  const unit = quantity.unit || quantity.code || "";

  return `${comparator}${value}${unit ? ` ${unit}` : ""}`;
}

/**
 * Format a FHIR Coding or CodeableConcept
 */
export function formatCoding(
  coding: FhirCoding | FhirCodeableConcept | undefined | null,
  options: {
    showCode?: boolean;
    showSystem?: boolean;
    fallback?: string;
  } = {}
): string {
  const { showCode = false, showSystem = false, fallback = "-" } = options;

  if (!coding) return fallback;

  // Handle CodeableConcept
  if ("coding" in coding || "text" in coding) {
    const concept = coding as FhirCodeableConcept;
    if (concept.text) return concept.text;
    const primaryCoding = concept.coding?.[0];
    if (!primaryCoding) return fallback;
    return formatCoding(primaryCoding, { showCode, showSystem, fallback });
  }

  // Handle Coding
  const { display, code, system } = coding as FhirCoding;
  const parts: string[] = [];

  if (display) parts.push(display);
  if (showCode && code) parts.push(`(${code})`);
  if (showSystem && system) parts.push(`[${system}]`);

  return parts.join(" ") || fallback;
}

/**
 * Format a FHIR Period
 */
export function formatPeriod(
  period: FhirPeriod | undefined | null,
  options: {
    fallback?: string;
  } = {}
): string {
  const { fallback = "-" } = options;

  if (!period) return fallback;

  const start = period.start ? formatFhirDate(period.start) : null;
  const end = period.end ? formatFhirDate(period.end) : null;

  if (start && end) {
    return `${start} - ${end}`;
  }
  if (start) {
    return `From ${start}`;
  }
  if (end) {
    return `Until ${end}`;
  }

  return fallback;
}

/**
 * Format a FHIR ContactPoint (phone, email, etc.)
 */
export function formatContactPoint(
  contact: FhirContactPoint | FhirContactPoint[] | undefined | null,
  options: {
    preferredSystem?: "phone" | "email";
    fallback?: string;
  } = {}
): string {
  const { preferredSystem, fallback = "-" } = options;

  if (!contact) return fallback;

  const contacts = Array.isArray(contact) ? contact : [contact];

  // Sort by rank if available
  const sorted = [...contacts].sort(
    (a, b) => (a.rank || 999) - (b.rank || 999)
  );

  // Find preferred or first with value
  const preferred =
    (preferredSystem && sorted.find((c) => c.system === preferredSystem)) ||
    sorted.find((c) => c.value);

  return preferred?.value || fallback;
}

/**
 * Format a FHIR Identifier
 */
export function formatIdentifier(
  identifier: FhirIdentifier | FhirIdentifier[] | undefined | null,
  options: {
    preferredType?: string;
    mask?: boolean;
    fallback?: string;
  } = {}
): string {
  const { preferredType, mask = false, fallback = "-" } = options;

  if (!identifier) return fallback;

  const identifiers = Array.isArray(identifier) ? identifier : [identifier];

  // Find by type or use first
  const preferred =
    (preferredType &&
      identifiers.find((id) =>
        id.type?.coding?.some((c) => c.code === preferredType)
      )) ||
    identifiers.find((id) => id.use === "official") ||
    identifiers[0];

  if (!preferred?.value) return fallback;

  if (mask) {
    const value = preferred.value;
    if (value.length <= 4) return "****";
    return "****" + value.slice(-4);
  }

  return preferred.value;
}

/**
 * Calculate age from birthDate
 */
export function calculateAge(
  birthDate: string | undefined | null,
  options: {
    referenceDate?: Date;
    format?: "years" | "full";
    fallback?: string;
  } = {}
): string {
  const {
    referenceDate = new Date(),
    format: ageFormat = "years",
    fallback = "-",
  } = options;

  if (!birthDate) return fallback;

  try {
    const birth = parseISO(birthDate);
    if (!isValid(birth)) return fallback;

    const years = referenceDate.getFullYear() - birth.getFullYear();
    const months = referenceDate.getMonth() - birth.getMonth();
    const days = referenceDate.getDate() - birth.getDate();

    let age = years;
    if (months < 0 || (months === 0 && days < 0)) {
      age--;
    }

    if (ageFormat === "full") {
      let monthsAge = months < 0 ? 12 + months : months;
      if (days < 0) monthsAge--;
      return age > 0 ? `${age}y ${monthsAge}m` : `${monthsAge}m`;
    }

    return `${age}`;
  } catch {
    return fallback;
  }
}

/**
 * Get display text for gender code
 */
export function formatGender(
  gender: string | undefined | null,
  options: {
    fallback?: string;
  } = {}
): string {
  const { fallback = "-" } = options;

  if (!gender) return fallback;

  const genderMap: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    unknown: "Unknown",
  };

  return genderMap[gender.toLowerCase()] || gender;
}
