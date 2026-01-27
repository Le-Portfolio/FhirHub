/**
 * Timeline DTOs
 *
 * Data transfer objects for patient timeline/history views.
 */

/**
 * Supported timeline resource types
 */
export type TimelineResourceType =
  | "Observation"
  | "Condition"
  | "MedicationRequest"
  | "Encounter"
  | "DiagnosticReport"
  | "Procedure"
  | "Immunization"
  | "AllergyIntolerance"
  | "DocumentReference";

/**
 * Timeline Event DTO
 *
 * Represents a single event in a patient's timeline.
 */
export interface TimelineEventDTO {
  id: string;
  resourceType: TimelineResourceType;
  title: string;
  description: string;
  date: string;
  status: "completed" | "active" | "cancelled" | "entered-in-error";
  details?: Record<string, string>;
  resourceId?: string;
}
