# System Architecture Document

## 1. Architectural Overview
The **Micro-Task Management System** utilizes an industry-standard **Three-Tier Layered Architecture** emphasizing loose coupling, separation of concerns, and clean data contracts between the presentation layer, the business logic layer, and the persistence layer.

```mermaid
graph TD
    subgraph Presentation_Tier [Presentation Tier - Single Page App]
        UI[React 19 + TypeScript + Tailwind CSS]
        Charts[Recharts Visualization Engine]
        Context[AuthContext + LocalStorage JWT]
    end

    subgraph Application_Tier [Application Tier - Python Flask REST API]
        Gateway[Flask Application Factory & CORS Gateway]
        Middleware[JWT Auth Middleware & RBAC Interceptors]
        Routes[API Route Blueprints: Auth, Tasks, Defects, Metrics, Reports, Admin]
        Engine[Automated Metrics Engine & Notification Service]
    end

    subgraph Persistence_Tier [Persistence Tier - Relational Storage]
        DB[(SQLite 3 Database - Foreign Keys Enforced)]
        Tables[users, tasks, task_status_history, defects, notifications, project_settings]
    end

    UI -->|HTTP / JSON via Vite Reverse Proxy| Gateway
    Gateway --> Middleware
    Middleware --> Routes
    Routes --> Engine
    Engine --> DB
    DB --> Tables
```

---

## 2. Layer Decomposition

### 2.1 Presentation Tier (Frontend)
- **Framework:** React 19 with TypeScript, bundled with Vite 8.
- **Styling:** Tailwind CSS v4 design system with tailored colors, responsive cards, badging, and accessible focus states.
- **Data Visualization:** Recharts library rendering Bar Charts, Donut Charts, and Histograms with responsive SVG viewports.
- **State Management:** React Context API (`AuthContext`) managing user session tokens and reactive authorization roles.
- **API Communication:** Centralized `ApiClient` with asynchronous fetch abstractions, authorization header injection, and automatic session expiration handling.

### 2.2 Application Tier (Backend REST API)
- **Framework:** Python Flask 3.x WSGI service.
- **Authentication & Security:** 
  - Password hashing utilizing `werkzeug.security` (Scrypt algorithm).
  - Stateless JSON Web Tokens (`PyJWT`) containing user ID, username, and role, signed via HMAC-SHA256.
  - Route decorators (`@jwt_required`, `@roles_required`) enforcing declarative server-side role validation.
- **Metrics Calculation Engine:** `MetricsEngine` module reading directly from SQLite row factories, applying ISO timestamp arithmetic with `python-dateutil`, and enforcing boundary case protections (e.g. division-by-zero mitigation).
- **Notification Daemon:** Lazy evaluation pipeline that detects upcoming deadlines and overdue milestones upon task retrieval, inserting unread notification rows with daily deduplication keys.

### 2.3 Persistence Tier (Database)
- **Engine:** SQLite 3 with `PRAGMA foreign_keys = ON;` connection configuration.
- **Transaction Safety:** Python `contextmanager` handling atomic commits and transaction rollback upon unexpected runtime exceptions.
- **Indexing Strategy:** B-Tree indexing on frequently filtered columns (`assigned_to_id`, `status`, `due_date`, `completed_at`, `created_at`).

---

## 3. Security Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as Flask REST API
    participant Auth as Auth Middleware
    participant DB as SQLite Database

    User->>API: POST /api/auth/login { username, password }
    API->>DB: SELECT id, password_hash, role FROM users WHERE username = ?
    DB-->>API: User Record
    API->>API: check_password_hash(hash, password)
    alt Invalid Password
        API-->>User: 401 Unauthorized
    else Valid Password
        API->>Auth: create_access_token(user_id, role)
        Auth-->>API: Signed JWT Token
        API-->>User: 200 OK { token, user }
    end

    Note over User, API: Subsequent Protected Request
    User->>API: GET /api/metrics/dashboard [Authorization: Bearer <token>]
    API->>Auth: decode_access_token(token)
    Auth->>Auth: Verify HMAC signature and expiration
    Auth-->>API: Set g.current_user
    API->>DB: Execute Metrics Queries
    DB-->>API: Real Relational Records
    API-->>User: 200 OK { metrics }
```
