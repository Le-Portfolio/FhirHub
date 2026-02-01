# FhirHub

A healthcare data platform built on **HL7 FHIR R4**. FhirHub provides a modern web interface for managing patients, vitals, conditions, medications, lab orders, and a clinical dashboard — backed by [HAPI FHIR](https://hapifhir.io/) and secured with [Keycloak](https://www.keycloak.org/).

## Tech Stack

### Server

- .NET 8 / ASP.NET Core (C#)
- [Hl7.Fhir.R4](https://github.com/FirelyTeam/firely-net-sdk) SDK
- Keycloak JWT authentication
- Serilog structured logging
- Swagger / OpenAPI via Swashbuckle
- FluentValidation
- Prometheus metrics

### Frontend

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4 + DaisyUI
- Keycloak.js 26
- Recharts
- Vitest + Testing Library

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│   Frontend   │────▶│   .NET API   │────▶│  HAPI FHIR   │────▶│ PostgreSQL │
│  :7002       │     │  :5197       │     │  :8080       │     │            │
└──────────────┘     └──────────────┘     └──────────────┘     └────────────┘
                            │
                            │ JWT
                            ▼
                     ┌──────────────┐     ┌────────────┐
                     │   Keycloak   │────▶│ PostgreSQL │
                     │   :8180      │     │ (Keycloak) │
                     └──────────────┘     └────────────┘
```

## Prerequisites

- **Docker & Docker Compose** (recommended)
- For local development: .NET 8 SDK, Node.js 20+

## Getting Started (Docker)

1. Copy and configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your desired passwords and settings
   ```

2. Start all services:

   ```bash
   make up
   # or: docker compose up -d
   ```

3. Access the application:

   | Service  | URL                        |
   | -------- | -------------------------- |
   | Frontend | http://localhost:7002       |
   | API      | http://localhost:5197       |
   | Swagger  | http://localhost:5197/swagger |
   | HAPI FHIR| http://localhost:8080       |
   | Keycloak | http://localhost:8180       |

4. Stop everything:

   ```bash
   make down
   ```

## Local Development

Start infrastructure services (PostgreSQL, HAPI FHIR, Keycloak):

```bash
make dev
```

Run the API:

```bash
cd FhirHubServer/src/FhirHubServer.Api
dotnet run
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for all available variables. Key settings:

| Variable | Default | Description |
| --- | --- | --- |
| `HAPI_PORT` | `8080` | HAPI FHIR server port |
| `KEYCLOAK_PORT` | `8180` | Keycloak port |
| `API_PORT` | `5197` | .NET API port |
| `FRONTEND_PORT` | `7002` | Next.js frontend port |
| `HAPI_DB_PASSWORD` | — | HAPI FHIR database password |
| `KC_DB_PASSWORD` | — | Keycloak database password |
| `KC_ADMIN_USER` | `admin` | Keycloak admin username |
| `KC_ADMIN_PASSWORD` | — | Keycloak admin password |
| `KC_REALM` | `fhirhub` | Keycloak realm name |
| `KC_CLIENT_ID` | `fhirhub-frontend` | Frontend OIDC client ID |
| `KC_BACKEND_CLIENT_SECRET` | — | Backend client secret |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5197` | API URL for the frontend |
| `NEXT_PUBLIC_KEYCLOAK_URL` | `http://localhost:8180` | Keycloak URL for the frontend |

## API Overview

All endpoints are prefixed with `/api` and require a valid JWT unless otherwise noted. Interactive docs are available at [`/swagger`](http://localhost:5197/swagger).

| Endpoint Group | Description |
| --- | --- |
| `/api/patients` | CRUD for patients, vitals, conditions, medications, labs, and timeline |
| `/api/dashboard` | Dashboard metrics, alerts, and activity feed |
| `/api/exports` | Create, track, retry, and cancel bulk data exports |
| `/api/users` | User management, roles, sessions, and MFA (admin) |
| `/api/audit` | User and admin audit event logs |
| `/api/observations` | Query all observations |
| `/api/conditions` | Query all conditions |
| `/api/medications` | Query all medications |

## Frontend Features

- **Clinical dashboard** — metrics cards, active alerts, and recent activity feed
- **Patient list** — search, filter, and paginate patients
- **Patient detail** — tabbed view with vitals, conditions, medications, labs, and timeline
- **Data export** — create and manage bulk FHIR data exports
- **User management** — create/edit users, assign roles, manage sessions (admin)
- **Audit logs** — review user and admin events (admin)
- **RBAC** — role-based access control via Keycloak
- **SMART on FHIR** — launch context support

## Make Targets

| Command | Description |
| --- | --- |
| `make up` | Start all services |
| `make down` | Stop all services |
| `make dev` | Start infrastructure only (Postgres, HAPI, Keycloak) |
| `make dev-api` | Start infra + API (for frontend-only local dev) |
| `make dev-frontend` | Run frontend in dev mode |
| `make build` | Build all Docker images |
| `make test` | Run all tests |
| `make test-api` | Run API tests |
| `make test-frontend` | Run frontend tests |
| `make lint` | Run all linters |
| `make logs` | Tail logs from all services |
| `make seed` | Seed FHIR server with sample data |
| `make clean` | Remove all containers, volumes, and local cluster |
| `make help` | Show available targets |

## Project Structure

```
FhirHub/
├── FhirHubServer/
│   ├── src/
│   │   ├── FhirHubServer.Api/       # ASP.NET Core API
│   │   └── FhirHubServer.Core/      # Domain models & services
│   └── tests/
├── frontend/                         # Next.js application
│   └── src/app/
├── helm/                             # Kubernetes Helm charts
│   ├── fhirhub/
│   ├── fhirhub-lib/
│   └── monitoring/
├── argocd/                           # GitOps configuration
├── scripts/                          # Deployment scripts
├── docker-compose.yml
├── docker-compose.override.yml
├── docker-compose.prod.yml
├── Makefile
└── .env.example
```
