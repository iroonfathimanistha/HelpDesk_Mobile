# System Architecture

> Status: Core backend implemented (auth, categories, providers, service requests, reviews). External integrations are planned.

## Overview

The platform consists of three client applications and one backend API. The backend is the **only** component that accesses the database and external services.

```mermaid
flowchart TD
    subgraph Clients
        CA[Customer App<br/>React Native]
        PA[Provider App<br/>React Native]
        AD[Admin Dashboard<br/>React.js]
    end

    CA -->|HTTPS + JWT| API
    PA -->|HTTPS + JWT| API
    AD -->|HTTPS + JWT| API

    API[Backend API<br/>Node.js + Express.js]

    API -->|Sequelize ORM| DB[(PostgreSQL)]

    subgraph External Services
        AI[LLM API]
        VAI[Vision AI API]
        MAPS[Maps API]
        FCM[Firebase Cloud Messaging]
        S3[AWS S3]
    end

    API --> AI
    API --> VAI
    API --> MAPS
    API --> FCM
    API --> S3
```

## Components

| Component | Responsibility |
|---|---|
| **Customer App** | Customers describe a household problem, view suggested providers and manage bookings. |
| **Provider App** | Providers manage their profile and availability and respond to job requests. |
| **Admin Dashboard** | Administrators verify providers, manage service categories and monitor activity. |
| **Backend API** | Authentication, authorization (roles), business rules, provider matching and all external integrations. |
| **PostgreSQL** | Persistent storage for users, providers, services, bookings and reviews. |

## External Integrations (backend only)

| Service | Planned use | Backend location |
|---|---|---|
| LLM API | Understand the customer's problem description and suggest a service category | `backend/src/services/ai/` |
| Vision AI API | Analyse photos of the problem uploaded by the customer | `backend/src/services/ai/` |
| Maps API | Locations, distances and nearby provider search | `backend/src/services/matching/` |
| Firebase Cloud Messaging | Push notifications to the mobile apps | `backend/src/services/notifications/` |
| AWS S3 | Storing uploaded images (problem photos, profile photos, documents) | `backend/src/services/storage/` |

## Key Principles

1. **Clients never hold secrets.** API keys for AI, maps (server-side), S3 and Firebase Admin stay in the backend.
2. **Layered backend.** Routes → Middleware → Controllers → Services → Models.
3. **Role-based access.** Every authenticated request carries a JWT that identifies the user and role (`customer`, `provider`, `admin`).

## Backend Request Flow

```
Request → Route → Middleware (authenticate, authorize role, validate) → Controller → Service → Model → PostgreSQL
```

| Layer | Folder | Responsibility |
|---|---|---|
| Route | `backend/src/routes/` | Maps URL + HTTP method to middleware and a controller. No logic. |
| Middleware | `backend/src/middleware/` | JWT authentication, role checks, validation errors, error responses. |
| Validator | `backend/src/validators/` | Rules for request body, params and query. |
| Controller | `backend/src/controllers/` | Reads validated input, calls a service, sends the JSON response. |
| Service | `backend/src/services/` | Business rules (e.g. who may accept a job) and database work. |
| Model | `backend/src/models/` | Sequelize models and relationships. |

The full endpoint list is in [API_SPEC.md](API_SPEC.md).

## Data Model

Schema is created by the migrations in [`database/migrations/`](../database/migrations/).

```mermaid
erDiagram
    users ||--o| provider_profiles : "has (providers only)"
    provider_profiles }o--o{ service_categories : "offers (provider_categories)"
    users ||--o{ service_requests : "creates (customer_id)"
    users |o--o{ service_requests : "is assigned (provider_id)"
    service_categories ||--o{ service_requests : "categorises"
    service_requests ||--o| reviews : "receives"

    users {
        int id PK
        string full_name
        string email UK
        string phone
        string password_hash
        enum role "customer | provider | admin"
        bool is_active
    }
    provider_profiles {
        int id PK
        int user_id FK, UK
        text bio
        int years_of_experience
        decimal hourly_rate
        string city
        double latitude
        double longitude
        bool is_available
        bool is_verified
        decimal average_rating
        int total_reviews
    }
    service_categories {
        int id PK
        string name UK
        string slug UK
        text description
        bool is_active
    }
    service_requests {
        int id PK
        int customer_id FK
        int provider_id FK "null until accepted"
        int category_id FK
        string title
        text description
        string address
        datetime preferred_date
        enum status "pending | accepted | in_progress | completed | cancelled | declined"
    }
    reviews {
        int id PK
        int service_request_id FK, UK
        int customer_id FK
        int provider_id FK
        smallint rating "1-5"
        text comment
    }
```

## Booking Flow

```mermaid
sequenceDiagram
    actor C as Customer App
    participant API as Backend API
    actor P as Provider App

    C->>API: POST /service-requests (category, problem, address)
    API-->>C: 201 status = pending
    P->>API: GET /service-requests/available
    API-->>P: open jobs in provider's categories
    P->>API: PATCH /service-requests/:id/accept
    API-->>P: 200 status = accepted (first provider wins)
    P->>API: PATCH /service-requests/:id/start
    P->>API: PATCH /service-requests/:id/complete
    C->>API: GET /service-requests/:id
    API-->>C: status = completed
    C->>API: POST /service-requests/:id/review (rating 1-5)
    API-->>C: 201, provider rating updated
```

## To Be Documented

- Deployment architecture (Render / AWS)
- AI, maps, notification and storage integrations once built
