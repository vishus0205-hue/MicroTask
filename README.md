# Micro-Task Management System with an Automated Software Metrics Dashboard

An academic-grade, college-submission-ready Software Engineering mini-project built with **React (TypeScript)**, **Tailwind CSS**, **Recharts**, **Python Flask**, and **SQLite**.

---

## 1. Project Overview & Features

The system enables agile software development teams to create, assign, prioritize, track, and complete granular engineering micro-tasks. The system autonomously tracks lifecycle state transitions (`created_at`, `started_at`, `due_date`, `completed_at`, reopening, and soft-deletion) and recalculates core **Software Engineering Process Metrics** in real time from relational database records:

1. **Task Completion Rate:** Evaluated against eligible non-cancelled tasks.
2. **Average Cycle Time:** Time delta between active start and deliverable completion in decimal hours.
3. **Task Throughput:** Volume of verified deliverables delivered in reporting periods.
4. **Overdue Task Count:** Active tasks whose target deadline has passed.
5. **Defect Rate:** Proportion of completed tasks encountering recorded software bugs.
6. **Rework Rate:** Percentage of completed tasks subsequently reopened via historical transitions.
7. **Workload Distribution:** Live task allocations across engineering personnel.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8
- **Styling:** Tailwind CSS v4 design system
- **Data Visualization:** Recharts (Throughput bars, Status donut, Workload distribution, Cycle time histogram)
- **Backend API:** Python 3 Flask REST API with modular blueprints
- **Database:** SQLite 3 with enforced foreign keys (`PRAGMA foreign_keys = ON;`)
- **Authentication:** JWT (JSON Web Tokens) with HMAC-SHA256 & Scrypt password hashing
- **Testing:** Pytest (17 unit & integration tests covering auth, tasks, metrics, and CSV export)

---

## 3. Quick Start Guide (Local Setup)

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed

### Step 1: Set Up Backend
Open your terminal in the project root:

```powershell
# 1. Create Python virtual environment
python -m venv backend/venv

# 2. Activate virtual environment (Windows PowerShell)
.\backend\venv\Scripts\Activate.ps1

# (On Linux/macOS, use: source backend/venv/bin/activate)

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Seed database with realistic demonstration tasks and users
python backend/scripts/seed_data.py
```

### Step 2: Set Up Frontend
In a second terminal:

```powershell
cd frontend
npm install
```

### Step 3: Run the Application Locally

#### Terminal 1 — Start the Flask REST API:
```powershell
.\backend\venv\Scripts\python .\backend\run.py
```
*API running at: `http://127.0.0.1:5000/api`*

#### Terminal 2 — Start the Vite Frontend Server:
```powershell
cd frontend
npm run dev
```
*Application interface live at: **`http://localhost:5173`***

---

## 4. Demo Account Credentials (College Viva Ready)

All demo accounts share the password: **`Demo@12345`**

| Role | Username | Full Name | Primary Capabilities |
|---|---|---|---|
| **Administrator** | `admin` | Dr. Sarah Jenkins | User management, system diagnostics, demo seed reset |
| **Project Manager** | `pm_alex` | Alex Morgan | Task CRUD, assignment, custom reports, CSV export |
| **Team Member** | `dev_priya` | Priya Sharma | Task execution, status transitions, defect reporting |
| **Team Member** | `dev_john` | John Doe | Full-stack engineering, effort logging |

*(Tip: The login screen contains 1-click quick login buttons for Admin, Manager, and Developer for effortless presentation).*

---

## 5. Running the Automated Tests

To execute the Pytest test suite:
```powershell
.\backend\venv\Scripts\pytest backend\tests -v
```

**Results:**
- **17 passed in ~1.27s**
- 100% pass rate covering authentication, RBAC, task lifecycle, metrics arithmetic, boundary cases, and CSV generation.

---

## 6. Software Engineering Documentation Index

Detailed documentation files are available in the [`docs/`](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs) directory:

1. [**01_SRS_DOCUMENT.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/01_SRS_DOCUMENT.md) — System Requirements Specification (Functional, Non-Functional, Personas).
2. [**02_SYSTEM_ARCHITECTURE.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/02_SYSTEM_ARCHITECTURE.md) — Three-Tier Architectural Specification & Security Model.
3. [**03_DATA_FLOW_DIAGRAMS.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/03_DATA_FLOW_DIAGRAMS.md) — DFD Level 0 Context & Level 1 Process Decomposition (Mermaid).
4. [**04_DATABASE_DESIGN_AND_ER.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/04_DATABASE_DESIGN_AND_ER.md) — Relational Schema, Constraints, Indexes & Mermaid ER Diagram.
5. [**05_SOFTWARE_ENGINEERING_METRICS.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/05_SOFTWARE_ENGINEERING_METRICS.md) — Mathematical Formulas, Boundary Conditions & Metric Rules.
6. [**06_REST_API_SPECIFICATION.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/06_REST_API_SPECIFICATION.md) — REST Endpoints, Payloads, Status Codes & Headers.
7. [**07_TEST_PLAN_AND_EXECUTION_REPORT.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/07_TEST_PLAN_AND_EXECUTION_REPORT.md) — Test Cases & Executed Pytest Results.
8. [**08_INSTALLATION_AND_USER_MANUAL.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/08_INSTALLATION_AND_USER_MANUAL.md) — Local Setup, Run Instructions & User Guide.
9. [**09_COLLEGE_SUBMISSION_SCREENSHOTS_CHECKLIST.md**](file:///c:/Users/91928/OneDrive/Desktop/MicroTask/docs/09_COLLEGE_SUBMISSION_SCREENSHOTS_CHECKLIST.md) — 13 Numbered Viva Presentation Screenshots Checklist.
