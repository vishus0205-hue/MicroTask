# Software Requirements Specification (SRS)

## Project Title
**Micro-Task Management System with an Automated Software Metrics Dashboard**

---

## 1. Abstract
In modern agile and devops software engineering environments, software projects often encounter schedule slippage, bottlenecked code review cycles, and hidden quality degradation. Many commercial task trackers either require heavy cloud infrastructure or fail to compute software engineering process metrics directly from real relational records. 

The **Micro-Task Management System with an Automated Software Metrics Dashboard** is an academic-grade, full-stack software application engineered to enable development teams to decompose engineering work into trackable micro-tasks. The system autonomously tracks lifecycle state transitions (creation, active work commencement, completion, cancellation, and reopening) and executes automated mathematical calculations to derive core Software Engineering metrics—specifically **Task Completion Rate**, **Average Cycle Time**, **Task Throughput**, **Overdue Task Count**, **Defect Rate**, **Rework Rate**, and **Workload Distribution**.

---

## 2. Problem Statement
Traditional project management workflows suffer from several structural deficiencies:
1. **Subjective Progress Reporting:** Teams frequently rely on manual self-reporting, causing discrepancies between apparent project velocity and actual deliverable completion.
2. **Disconnected Quality and Process Metrics:** Defect tracking and task rework are frequently managed in disparate tools, preventing real-time correlation between cycle time and defect discovery.
3. **Lack of Transparent Metric Formats:** Commercial suites present black-box "productivity scores" that cannot be audited or replicated in an academic software measurement setting.
4. **Cloud Dependency:** Many modern tools cannot run in self-contained local environments without paid third-party software subscriptions.

---

## 3. Objectives & Scope

### 3.1 Objectives
- Provide a responsive, secure web-based interface for managing software micro-tasks.
- Implement role-based access control (RBAC) supporting **Administrator**, **Project Manager**, and **Team Member** roles.
- Maintain an append-only audit trail (`task_status_history`) for state transitions to enable longitudinal process analysis.
- Implement a backend **Software Metrics Engine** that executes real-time calculations from relational SQLite tables with safe handling of division-by-zero, missing timestamps, and date filters.
- Provide data visualization via interactive Recharts components and export capabilities via compliant CSV generation.

### 3.2 Scope
- **In Scope:**
  - Complete Task CRUD operations, assignment, prioritization, and status transitions.
  - Defect logging and resolution directly linked to parent tasks.
  - In-app notification engine with duplicate suppression for assignments, status changes, approaching deadlines, and overdue tasks.
  - Automated calculation and visualization of 7 software engineering metrics.
  - Filtered task reports and CSV exports.
  - User administration and password modification.
- **Out of Scope (By Design for Mini-Project):**
  - Paid cloud integrations (AWS/GCP/Azure).
  - External SMTP mail servers (in-app notifications are utilized instead for zero-cost self-containment).
  - Subjective individual productivity rankings (metrics measure team process health).

---

## 4. Existing System vs. Proposed System

| Dimension | Existing Systems (Spreadsheets / Generic Trackers) | Proposed Micro-Task System |
|---|---|---|
| **Data Storage** | Unconstrained sheets or fragmented SaaS | Normalized SQLite database with enforced foreign keys |
| **State Audit Trail** | Overwritten state cells; lost historical context | Dedicated `task_status_history` table capturing timestamps and actors |
| **Cycle Time Calculation** | Manual estimation; subjective | Automated: `completed_at - started_at` evaluated strictly on verified timestamps |
| **Rework Tracking** | Typically untracked or treated as new tasks | Explicit detection of transitions from `completed` back to active states |
| **Defect Correlation** | Maintained in separate spreadsheets | Foreign-key linked `defects` table associated directly with tasks |
| **Cost & Portability** | Subscription fees or vendor lock-in | 100% self-contained local stack (Python Flask, SQLite, React, Vite) |

---

## 5. User Roles and Personas

### 5.1 Administrator (Admin)
- **Persona:** Lead Architect / System Administrator (e.g., *Dr. Sarah Jenkins*)
- **Responsibilities:**
  - Create and manage team accounts, assign user roles, and deactivate inactive members.
  - Access system diagnostic telemetry (database engine, file size, row counts).
  - Configure sprint target thresholds (velocity, acceptable cycle times, defect tolerance).
  - Trigger realistic database re-seeding for demonstration and testing purposes.

### 5.2 Project Manager (PM)
- **Persona:** Agile Sprint Manager / Scrum Master (e.g., *Alex Morgan*)
- **Responsibilities:**
  - Create micro-tasks, allocate estimated hours, assign team members, and define deadlines.
  - Supervise sprint delivery cadence, monitor overdue alerts, and view workload distribution charts.
  - Generate customized reports and export filtered CSV deliverables.

### 5.3 Team Member (Developer / QA)
- **Persona:** Full-Stack Engineer / Quality Analyst (e.g., *Priya Sharma*)
- **Responsibilities:**
  - Review personal assigned tasks in the backlog.
  - Transition task states (To Do → In Progress → Completed).
  - Record actual effort hours expended during development.
  - Log defects identified during testing and resolve defects upon bug-fix verification.
  - Receive in-app notifications on task assignments and impending deadlines.

---

## 6. Functional Requirements

- **FR-01 (Authentication):** The system shall authenticate users using username/email and password verified via Scrypt hashing, issuing signed JSON Web Tokens (JWT) for session management.
- **FR-02 (Role-Based Authorization):** Backend API endpoints and frontend controls shall enforce role permissions (Admin, Project Manager, Team Member).
- **FR-03 (Task CRUD):** Managers and Admins shall be capable of creating, editing, and soft-deleting tasks.
- **FR-04 (Task Lifecycle & Timestamping):** The system shall automatically record `started_at` when entering `in_progress` and `completed_at` when entering `completed`.
- **FR-05 (Audit Trail Recording):** Every task status alteration shall record a row in `task_status_history` capturing old status, new status, timestamp, author, and reason.
- **FR-06 (Defect Association):** Users shall be able to log defects with assigned severity against any task.
- **FR-07 (Metrics Calculation):** The backend Metrics Engine shall dynamically recalculate Completion Rate, Average Cycle Time, Throughput, Overdue Count, Defect Rate, Rework Rate, and Workload Distribution.
- **FR-08 (In-App Notifications):** The system shall issue notifications for assignments, reassignments, approaching deadlines, and overdue tasks with daily duplicate suppression.
- **FR-09 (Reporting & CSV Export):** The system shall filter task collections by date, assignee, status, and priority, outputting sanitized, quoted CSV files.

---

## 7. Non-Functional Requirements

- **NFR-01 (Performance):** Dashboard metrics and chart calculations shall execute within 200 milliseconds on relational datasets up to 10,000 tasks.
- **NFR-02 (Security):** Plaintext passwords shall never be persisted or logged; passwords must be hashed using modern algorithms (`scrypt`). Bearer tokens must be validated with HMAC-SHA256 signatures.
- **NFR-03 (Data Integrity):** The SQLite database must enforce `PRAGMA foreign_keys = ON` to guarantee relational integrity across parent tasks, defects, and history rows.
- **NFR-04 (Usability & Accessibility):** The UI shall support responsive breakpoints across desktop, tablet, and mobile displays with standardized contrast ratios and semantic HTML.
- **NFR-05 (Reliability & Fault Tolerance):** Metric calculations shall safely handle zero eligible tasks, missing timestamps, and empty queries without throwing unhandled exceptions.
