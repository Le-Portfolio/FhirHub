/**
 * FHIR R4 Primitive and Complex Data Types
 * Spec: https://hl7.org/fhir/R4/datatypes.html
 */

// ============================================================
// PRIMITIVE TYPES
// ============================================================

/**
 * Resource metadata
 * Spec: https://hl7.org/fhir/R4/resource.html#Meta
 */
export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: Coding[];
  tag?: Coding[];
}

/**
 * A reference from one resource to another
 * Spec: https://hl7.org/fhir/R4/references.html
 */
export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

/**
 * An identifier intended for computation
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Identifier
 */
export interface Identifier {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

/**
 * A reference to a code defined by a terminology system
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Coding
 */
export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

/**
 * Concept - reference to a terminology or just text
 * Spec: https://hl7.org/fhir/R4/datatypes.html#CodeableConcept
 */
export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

/**
 * A measured or measurable amount
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Quantity
 */
export interface Quantity {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

/**
 * A length of time
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Duration
 */
export type Duration = Quantity;

/**
 * A set of ordered Quantity values
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Range
 */
export interface Range {
  low?: Quantity;
  high?: Quantity;
}

/**
 * A ratio of two Quantity values
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Ratio
 */
export interface Ratio {
  numerator?: Quantity;
  denominator?: Quantity;
}

/**
 * Time range defined by start and end date/time
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Period
 */
export interface Period {
  start?: string;
  end?: string;
}

/**
 * Name of a human
 * Spec: https://hl7.org/fhir/R4/datatypes.html#HumanName
 */
export interface HumanName {
  use?:
    | "usual"
    | "official"
    | "temp"
    | "nickname"
    | "anonymous"
    | "old"
    | "maiden";
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

/**
 * Details of a Technology mediated contact point
 * Spec: https://hl7.org/fhir/R4/datatypes.html#ContactPoint
 */
export interface ContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
  period?: Period;
}

/**
 * An address expressed using postal conventions
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Address
 */
export interface Address {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

/**
 * Text node with attribution
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Annotation
 */
export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

/**
 * A timing schedule that specifies an event
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Timing
 */
export interface Timing {
  event?: string[];
  repeat?: TimingRepeat;
  code?: CodeableConcept;
}

export interface TimingRepeat {
  boundsDuration?: Duration;
  boundsPeriod?: Period;
  boundsRange?: Range;
  count?: number;
  countMax?: number;
  duration?: number;
  durationMax?: number;
  durationUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  frequency?: number;
  frequencyMax?: number;
  period?: number;
  periodMax?: number;
  periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  dayOfWeek?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  timeOfDay?: string[];
  when?: string[];
  offset?: number;
}

/**
 * Contact information
 * Spec: https://hl7.org/fhir/R4/metadatatypes.html#ContactDetail
 */
export interface ContactDetail {
  name?: string;
  telecom?: ContactPoint[];
}

/**
 * Content in a format defined elsewhere
 * Spec: https://hl7.org/fhir/R4/datatypes.html#Attachment
 */
export interface Attachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

// ============================================================
// BASE RESOURCE
// ============================================================

/**
 * Base Resource - all resources extend this
 * Spec: https://hl7.org/fhir/R4/resource.html
 */
export interface Resource {
  resourceType: string;
  id?: string;
  meta?: Meta;
  implicitRules?: string;
  language?: string;
}

/**
 * DomainResource - base for all domain resources
 * Spec: https://hl7.org/fhir/R4/domainresource.html
 */
export interface DomainResource extends Resource {
  text?: Narrative;
  contained?: Resource[];
  extension?: Extension[];
  modifierExtension?: Extension[];
}

/**
 * Human-readable summary
 * Spec: https://hl7.org/fhir/R4/narrative.html
 */
export interface Narrative {
  status: "generated" | "extensions" | "additional" | "empty";
  div: string;
}

/**
 * Extension - additional data
 * Spec: https://hl7.org/fhir/R4/extensibility.html
 */
export interface Extension {
  url: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueString?: string;
  valueCode?: string;
  valueDateTime?: string;
  valueDate?: string;
  valueTime?: string;
  valueCoding?: Coding;
  valueCodeableConcept?: CodeableConcept;
  valueQuantity?: Quantity;
  valueReference?: Reference;
  valuePeriod?: Period;
  valueIdentifier?: Identifier;
  valueHumanName?: HumanName;
  valueAddress?: Address;
  valueContactPoint?: ContactPoint;
  extension?: Extension[];
}
