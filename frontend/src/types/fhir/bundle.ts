/**
 * FHIR R4 Bundle and Related Resources
 * Spec: https://hl7.org/fhir/R4/bundle.html
 */

import type {
  Resource,
  Identifier,
  Reference,
  Coding,
  CodeableConcept,
  Period,
} from "./primitives";

/**
 * Bundle Resource
 *
 * A container for a collection of resources.
 */
export interface Bundle<T extends Resource = Resource> extends Resource {
  resourceType: "Bundle";

  /** Persistent identifier for the bundle */
  identifier?: Identifier;

  /** document | message | transaction | transaction-response | batch | batch-response | history | searchset | collection */
  type: BundleType;

  /** When the bundle was assembled */
  timestamp?: string;

  /** If search, the total number of matches */
  total?: number;

  /** Links related to this Bundle */
  link?: BundleLink[];

  /** Entry in the bundle - will have a resource or information */
  entry?: BundleEntry<T>[];

  /** Digital Signature */
  signature?: Signature;
}

/**
 * Bundle type codes
 */
export type BundleType =
  | "document"
  | "message"
  | "transaction"
  | "transaction-response"
  | "batch"
  | "batch-response"
  | "history"
  | "searchset"
  | "collection";

/**
 * Links related to this Bundle
 */
export interface BundleLink {
  /** See http://www.iana.org/assignments/link-relations/link-relations.xhtml#link-relations-1 */
  relation: string;

  /** Reference details for the link */
  url: string;
}

/**
 * Entry in the bundle
 */
export interface BundleEntry<T extends Resource = Resource> {
  /** Links related to this entry */
  link?: BundleLink[];

  /** URI for resource (Absolute URL server address or URI for UUID/OID) */
  fullUrl?: string;

  /** A resource in the bundle */
  resource?: T;

  /** Search related information */
  search?: BundleEntrySearch;

  /** Additional execution information (transaction/batch/history) */
  request?: BundleEntryRequest;

  /** Results of execution (transaction/batch/history) */
  response?: BundleEntryResponse;
}

/**
 * Search related information
 */
export interface BundleEntrySearch {
  /** match | include | outcome - why this is in the result set */
  mode?: "match" | "include" | "outcome";

  /** Search ranking (between 0 and 1) */
  score?: number;
}

/**
 * Additional execution information (transaction/batch/history)
 */
export interface BundleEntryRequest {
  /** GET | HEAD | POST | PUT | DELETE | PATCH */
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "PATCH";

  /** URL for HTTP equivalent of this entry */
  url: string;

  /** For managing cache currency */
  ifNoneMatch?: string;

  /** For managing cache currency */
  ifModifiedSince?: string;

  /** For managing update contention */
  ifMatch?: string;

  /** For conditional creates */
  ifNoneExist?: string;
}

/**
 * Results of execution (transaction/batch/history)
 */
export interface BundleEntryResponse {
  /** Status response code (text optional) */
  status: string;

  /** The location (if the operation returns a location) */
  location?: string;

  /** The Etag for the resource (if relevant) */
  etag?: string;

  /** Server's date time modified */
  lastModified?: string;

  /** OperationOutcome with hints and warnings (for batch/transaction) */
  outcome?: Resource;
}

/**
 * Digital Signature
 */
export interface Signature {
  /** Indication of the reason the entity signed the object(s) */
  type: Coding[];

  /** When the signature was created */
  when: string;

  /** Who signed */
  who: Reference;

  /** The party represented */
  onBehalfOf?: Reference;

  /** The technical format of the signed resources */
  targetFormat?: string;

  /** The technical format of the signature */
  sigFormat?: string;

  /** The actual signature content (XML DigSig or a Jwt) */
  data?: string;
}

/**
 * OperationOutcome Resource
 * Spec: https://hl7.org/fhir/R4/operationoutcome.html
 */
export interface OperationOutcome extends Resource {
  resourceType: "OperationOutcome";

  /** A single issue associated with the action */
  issue: OperationOutcomeIssue[];
}

/**
 * A single issue associated with the action
 */
export interface OperationOutcomeIssue {
  /** fatal | error | warning | information */
  severity: "fatal" | "error" | "warning" | "information";

  /** Error or warning code */
  code: string;

  /** Additional details about the error */
  details?: CodeableConcept;

  /** Additional diagnostic information about the issue */
  diagnostics?: string;

  /** Deprecated: Path of element(s) related to issue */
  location?: string[];

  /** FHIRPath of element(s) related to issue */
  expression?: string[];
}

/**
 * AuditEvent Resource
 * Spec: https://hl7.org/fhir/R4/auditevent.html
 */
export interface AuditEvent extends Resource {
  resourceType: "AuditEvent";

  /** Type/identifier of event */
  type: Coding;

  /** More specific type/id for the event */
  subtype?: Coding[];

  /** Type of action performed during the event */
  action?: "C" | "R" | "U" | "D" | "E";

  /** When the activity occurred */
  period?: Period;

  /** Time when the event was recorded */
  recorded: string;

  /** Whether the event succeeded or failed */
  outcome?: "0" | "4" | "8" | "12";

  /** Description of the event outcome */
  outcomeDesc?: string;

  /** The purposeOfUse of the event */
  purposeOfEvent?: CodeableConcept[];

  /** Actor involved in the event */
  agent: AuditEventAgent[];

  /** Audit Event Reporter */
  source: AuditEventSource;

  /** Data or objects used */
  entity?: AuditEventEntity[];
}

/**
 * Actor involved in the event
 */
export interface AuditEventAgent {
  /** How agent participated */
  type?: CodeableConcept;

  /** Agent role in the event */
  role?: CodeableConcept[];

  /** Identifier of who */
  who?: Reference;

  /** Alternative User identity */
  altId?: string;

  /** Human friendly name for the agent */
  name?: string;

  /** Whether user is initiator */
  requestor: boolean;

  /** Where */
  location?: Reference;

  /** Policy that authorized event */
  policy?: string[];

  /** Type of media */
  media?: Coding;

  /** Logical network location for application activity */
  network?: AuditEventAgentNetwork;

  /** Reason given for this user */
  purposeOfUse?: CodeableConcept[];
}

/**
 * Logical network location for application activity
 */
export interface AuditEventAgentNetwork {
  /** Identifier for the network access point of the user device */
  address?: string;

  /** The type of network access point */
  type?: "1" | "2" | "3" | "4" | "5";
}

/**
 * Audit Event Reporter
 */
export interface AuditEventSource {
  /** Logical source location within the enterprise */
  site?: string;

  /** The identity of source detecting the event */
  observer: Reference;

  /** The type of source where event originated */
  type?: Coding[];
}

/**
 * Data or objects used
 */
export interface AuditEventEntity {
  /** Specific instance of resource */
  what?: Reference;

  /** Type of entity involved */
  type?: Coding;

  /** What role the entity played */
  role?: Coding;

  /** Life-cycle stage for the entity */
  lifecycle?: Coding;

  /** Security labels on the entity */
  securityLabel?: Coding[];

  /** Descriptor for entity */
  name?: string;

  /** Descriptive text */
  description?: string;

  /** Query parameters */
  query?: string;

  /** Additional Information about the entity */
  detail?: AuditEventEntityDetail[];
}

/**
 * Additional Information about the entity
 */
export interface AuditEventEntityDetail {
  /** Name of the property */
  type: string;

  /** Property value (string) */
  valueString?: string;

  /** Property value (base64Binary) */
  valueBase64Binary?: string;
}
