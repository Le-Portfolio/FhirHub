# FhirHub UI/UX Features

## Design Philosophy

Clean, clinical aesthetic. Think "modern EHR that doesn't suck." The UI should feel familiar to healthcare workers but noticeably better than legacy systems. Prioritize information density without clutter, clear visual hierarchy, and instant feedback on all interactions.

---

## Core Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────┐  FhirHub          🔍 Search patients...        [Dr. Smith ▼]│
│  │ Logo│                                                             │
├──┴─────┴─────────────────────────────────────────────────────────────┤
│         │                                                            │
│  Dashboard    │  ┌──────────────────────────────────────────────┐   │
│  Patients     │  │                                              │   │
│  Observations │  │              MAIN CONTENT AREA               │   │
│  Conditions   │  │                                              │   │
│  Medications  │  │                                              │   │
│  ─────────    │  │                                              │   │
│  Bulk Export  │  │                                              │   │
│  Settings     │  │                                              │   │
│               │  └──────────────────────────────────────────────┘   │
│               │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

---

## Feature Breakdown

### 1. Dashboard (Landing Page)

**Purpose:** At-a-glance system overview, quick access to recent activity

**Components:**

- **Stats Cards** — Total patients, observations today, active conditions, pending meds
- **Recent Patients** — Last 5 accessed patients with quick-jump
- **Alerts Panel** — Critical lab values, overdue medications, flagged conditions
- **Activity Feed** — Real-time log of recent FHIR operations (created, updated, deleted)
- **System Health** — FHIR server status, auth server status, API response times

**Visual:**

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  👥 1,247   │  📊 342     │  🩺 89      │  💊 156     │
│  Patients   │  Obs Today  │  Active Dx  │  Active Rx  │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─ Recent Patients ─────────┐  ┌─ Alerts ──────────────────┐
│ • John Smith (2 min ago)  │  │ ⚠️ Critical K+ 6.2 mEq/L │
│ • Maria Garcia (15 min)   │  │ ⚠️ BP 180/110 - J.Smith  │
│ • Robert Chen (1 hr)      │  │ 🔔 3 pending refills      │
└───────────────────────────┘  └───────────────────────────┘
```

---

### 2. Patient Search & List

**Purpose:** Find patients quickly with flexible search

**Features:**

- **Smart Search Bar** — Searches name, MRN, DOB, phone simultaneously
- **Filter Pills** — Active, Has Alerts, Recently Updated, Has Conditions
- **Sort Options** — Name, Last Updated, DOB, # of Conditions
- **View Toggle** — Card view vs Table view
- **Infinite Scroll** — Load more as user scrolls

**Patient Card Preview:**

```
┌─────────────────────────────────────────────────────────┐
│  [Avatar]  John Smith                    DOB: 03/15/1985│
│            MRN: 12345678                 Age: 40 M      │
│            ─────────────────────────────────────────────│
│            🩺 3 Active Conditions   💊 5 Medications    │
│            ⚠️ 2 Alerts              📅 Last: 2 hrs ago │
└─────────────────────────────────────────────────────────┘
```

**Search UX:**

- Debounced search (300ms)
- Highlight matching text in results
- "No results" state with suggestions
- Recent searches dropdown

---

### 3. Patient Detail View (The Money Screen)

**Purpose:** Complete patient picture in one view — this is what you demo

**Layout: Tab-based with persistent header**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back    John Smith                                    [Actions ▼]│
│            MRN: 12345678 • DOB: 03/15/1985 • 40y Male              │
│            📞 (555) 123-4567 • 📍 Dallas, TX                       │
├─────────────────────────────────────────────────────────────────────┤
│  [Overview]  [Vitals]  [Labs]  [Conditions]  [Medications]  [Timeline]
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         TAB CONTENT                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tab: Overview (Default)

- **Demographics Card** — Full patient info, emergency contact
- **Active Problems Summary** — Top 5 conditions with severity badges
- **Current Medications** — Active meds with next refill dates
- **Recent Vitals Snapshot** — Last recorded BP, HR, Temp, Weight
- **Upcoming/Recent Encounters** — If you add Encounter resource later

#### Tab: Vitals

- **Vitals Chart** — Interactive line chart (Recharts)
  - Toggle: BP, Heart Rate, Temperature, Weight, SpO2
  - Time range selector: 7d, 30d, 90d, 1y, All
  - Hover for exact values
  - Reference range bands (shaded normal zones)
- **Vitals Table** — Sortable, filterable table below chart
- **Add Vital Button** — Modal form to record new observation

**Vitals Chart Mockup:**

```
Blood Pressure Trend (Last 30 Days)
     ┌────────────────────────────────────────────┐
 180 │                                            │ ← Hypertensive
     │         ╭╮                                 │
 140 │ ──────────────────────────────────────────│ ← Normal ceiling
     │╭─╮ ╭──╮│  │╭╮  ╭─╮                        │
 120 ││ ╰╯   ╰╯  ╰╯╰──╯ ╰───────────────────────│ ← Systolic
     │                                            │
  80 │──────────────────────────────────────────│ ← Diastolic
     │                                            │
     └────────────────────────────────────────────┘
       Jan 1        Jan 15        Jan 30
```

#### Tab: Labs

- **Lab Results Grouped by Panel** — CBC, BMP, Lipid Panel, etc.
- **Abnormal Highlighting** — Red for critical, yellow for out of range
- **Trend Sparklines** — Mini charts next to each lab value
- **Reference Ranges** — Show normal range inline
- **Historical Comparison** — "vs last result" with arrow indicator

**Lab Result Row:**

```
┌────────────────────────────────────────────────────────────────┐
│ Potassium    5.8 mEq/L ↑  [▁▂▃▅▇] (3.5-5.0)   Critical High  │
│              ^^^ value     ^^^ sparkline       ^^^ badge       │
└────────────────────────────────────────────────────────────────┘
```

#### Tab: Conditions

- **Active vs Resolved Toggle**
- **Condition Cards** with:
  - Condition name + ICD-10 code
  - Clinical status badge (Active, Resolved, Remission)
  - Verification status (Confirmed, Provisional, Differential)
  - Onset date
  - Severity indicator (Mild, Moderate, Severe)
  - Associated medications (linked)
- **Add Condition** — Form with ICD-10 autocomplete search

#### Tab: Medications

- **Active Medications List**
  - Drug name, dose, frequency, route
  - Prescriber name
  - Start date, end date (if applicable)
  - Status badge (Active, On Hold, Stopped)
  - Refill info (if applicable)
- **Medication History** — Collapsed section for past meds
- **Add Medication** — Form with RxNorm autocomplete

#### Tab: Timeline

- **Unified Activity Stream** — All resources in chronological order
- **Filter by Type** — Observations, Conditions, Medications
- **Visual Timeline** — Vertical timeline with icons per resource type
- **Expandable Cards** — Click to see full resource details

```
│
├─ 🩺 Jan 25, 2025 — Condition Added
│     Type 2 Diabetes (E11.9) - Active
│
├─ 📊 Jan 25, 2025 — Vitals Recorded
│     BP: 138/88, HR: 72, Temp: 98.6°F
│
├─ 💊 Jan 20, 2025 — Medication Started
│     Metformin 500mg BID
│
├─ 📊 Jan 15, 2025 — Lab Results
│     HbA1c: 7.2% (was 8.1%)
│
```

---

### 4. Observation Entry Forms

**Purpose:** Record new vitals/labs with validation

**Vital Signs Form:**

- Smart defaults (current date/time)
- Unit conversion helpers (F↔C, lbs↔kg)
- Validation against reasonable ranges
- Quick-entry mode for multiple vitals at once

**Lab Entry Form:**

- Panel templates (CBC, BMP, etc.)
- Auto-populate reference ranges
- Flag abnormals on entry
- Batch entry for full panel

---

### 5. Bulk Data Export

**Purpose:** Demonstrate FHIR Bulk Data spec understanding

**Features:**

- **Export Wizard**
  - Step 1: Select export type (All data, Patient-level, Group)
  - Step 2: Select resource types (checkboxes)
  - Step 3: Date range filter (optional)
  - Step 4: Confirm and start
- **Export Queue**
  - Progress bar with percentage
  - Estimated time remaining
  - Cancel button
  - Status: Queued → Processing → Complete → Expired

- **Download Manager**
  - List of completed exports
  - File size, resource counts
  - Download NDJSON files
  - Expiration countdown (24hr default)

```
┌─ Export Jobs ───────────────────────────────────────────────┐
│                                                             │
│  ✅ Export #1247                           [Download ▼]     │
│     All Patients • 1,247 resources • 2.3 MB                │
│     Completed 2 hours ago • Expires in 22 hours            │
│                                                             │
│  ⏳ Export #1248                           [Cancel]         │
│     Patient/123 • Processing...                            │
│     ████████████░░░░░░░░ 62%  ~3 min remaining            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. SMART on FHIR Launch Demo

**Purpose:** Show you understand the auth flow (huge differentiator)

**Features:**

- **Launch Simulator** — Pretend to be an EHR launching your app
- **Token Inspector** — Display decoded JWT, scopes granted
- **Scope Visualizer** — Show what data access was authorized
- **Context Display** — Show patient/encounter context passed in

```
┌─ SMART Launch Context ──────────────────────────────────────┐
│                                                             │
│  Launch Type:    EHR Launch                                │
│  Patient:        John Smith (Patient/123)                  │
│  Practitioner:   Dr. Sarah Chen                            │
│                                                             │
│  Granted Scopes:                                           │
│    ✅ patient/Patient.read                                 │
│    ✅ patient/Observation.read                             │
│    ✅ patient/Observation.write                            │
│    ✅ patient/Condition.read                               │
│    ❌ patient/MedicationRequest.write (not requested)      │
│                                                             │
│  Token Expires:  2025-01-26 15:30:00 (58 min remaining)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. Settings & Dev Tools

**Purpose:** Configuration and debugging aids

**Sections:**

- **FHIR Server Config** — Endpoint URL, version display
- **Auth Config** — Keycloak realm, client ID
- **Theme Toggle** — Light/Dark mode
- **Developer Panel** (collapsible)
  - Raw FHIR request/response viewer
  - Network log
  - Token refresh button

---

## UX Polish Features

### Global

- **Dark Mode** — Full theme support, respects system preference
- **Keyboard Shortcuts** — Cmd+K for search, Esc to close modals
- **Toast Notifications** — Success, error, warning feedback
- **Loading Skeletons** — Not spinners, content-shaped placeholders
- **Empty States** — Helpful illustrations + CTAs when no data
- **Responsive** — Works on tablet (realistic for clinical use)

### Micro-interactions

- **Optimistic Updates** — UI updates before server confirms
- **Hover Previews** — Patient cards on reference links
- **Smooth Transitions** — Page and modal animations
- **Pull-to-Refresh** — On patient list (mobile feel)

### Accessibility

- **ARIA Labels** — Screen reader support
- **Focus Management** — Logical tab order
- **Color Contrast** — WCAG AA compliant
- **Error Announcements** — Form validation read aloud

---

## Component Library Candidates (shadcn/ui)

**Definitely Use:**

- Card, Button, Input, Select, Badge
- Tabs, Dialog (Modal), Sheet (Side panel)
- Table, DataTable with sorting/filtering
- Toast, Alert
- Skeleton, Spinner
- Command (for Cmd+K search)
- Tooltip, Popover

**Charts (Recharts):**

- LineChart — Vitals trends
- AreaChart — Lab trends with reference bands
- BarChart — Observation frequency

---

## Screens Priority (Build Order)

### Phase 1: Core Patient Experience

1. Layout shell (sidebar, header, routing)
2. Patient List with search
3. Patient Detail — Overview tab
4. Patient Detail — Vitals tab with chart

### Phase 2: Full Resource Coverage

5. Patient Detail — Labs tab
6. Patient Detail — Conditions tab
7. Patient Detail — Medications tab
8. Patient Detail — Timeline tab

### Phase 3: Data Entry

9. Add Vital form
10. Add Condition form (with ICD-10 search)
11. Add Medication form (with RxNorm search)

### Phase 4: Advanced Features

12. Dashboard home page
13. Bulk Export wizard
14. SMART Launch demo page
15. Settings / Dev tools

### Phase 5: Polish

16. Dark mode
17. Keyboard shortcuts
18. Loading states everywhere
19. Error boundaries
20. Mobile responsive tweaks

---

## Mock Data Strategy

Before backend exists, use static JSON files:

```
client/
  src/
    mocks/
      patients.json       # 10-20 synthetic patients
      observations.json   # Vitals for each patient
      conditions.json     # 2-5 conditions per patient
      medications.json    # 3-7 meds per patient
```

Generate with Synthea, then extract the JSON. This lets you build the entire UI without touching Docker.
