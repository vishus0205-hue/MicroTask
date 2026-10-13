# Data Flow Diagrams (DFD)

This document contains editable, standard-compliant Data Flow Diagrams for the **Micro-Task Management System**, explicitly distinguishing External Entities, Processes, Data Stores, and Data Flows.

---

## 1. DFD Level 0: Context Analysis Diagram

The Level 0 Context Diagram represents the entire system as a singular process bubble interacting with the three primary human external entities.

```mermaid
graph TD
    %% External Entities
    Admin([Administrator])
    PM([Project Manager])
    Dev([Team Member])

    %% Main Process
    System((0.0<br/>Micro-Task Management &<br/>Metrics Engine System))

    %% Data Flows: Administrator
    Admin -->|User Credentials & Role Grants| System
    Admin -->|Project Settings & Thresholds| System
    System -->|System Diagnostic Telemetry & Reports| Admin

    %% Data Flows: Project Manager
    PM -->|Task Specifications & Assignments| System
    PM -->|Filter Parameters & Export Requests| System
    System -->|Process Metrics & Formatted CSV Exports| PM
    System -->|Overdue Alerts & Milestone Notifications| PM

    %% Data Flows: Team Member
    Dev -->|Status Transitions & Actual Hours| System
    Dev -->|Defect Bug Reports| System
    System -->|Assigned Task Details & Backlog| Dev
    System -->|Task Assignment & Deadline Notifications| Dev
```

---

## 2. DFD Level 1: Sub-System Process Decomposition

The Level 1 diagram decomposes the system into functional sub-processes, showing interactions with persisted relational data stores.

```mermaid
graph TD
    %% External Entities
    subgraph Entities [External Entities]
        Admin([Administrator])
        PM([Project Manager])
        Dev([Team Member])
    end

    %% Processes
    subgraph Processes [System Functional Processes]
        P1((1.0<br/>Authentication &<br/>RBAC Authorization))
        P2((2.0<br/>Task Lifecycle &<br/>Assignment Engine))
        P3((3.0<br/>Defect Logging &<br/>Resolution Engine))
        P4((4.0<br/>Automated Software<br/>Metrics Engine))
        P5((5.0<br/>Deadline & Alert<br/>Notification Daemon))
        P6((6.0<br/>Reporting & CSV<br/>Export Generator))
    end

    %% Data Stores
    subgraph DataStores [Relational Data Stores]
        D1[(D1: Users Store)]
        D2[(D2: Tasks Store)]
        D3[(D3: Task Status History)]
        D4[(D4: Defects Store)]
        D5[(D5: Notifications Store)]
        D6[(D6: Project Settings)]
    end

    %% Flows: Process 1.0 (Auth)
    Admin -->|User Registration Data| P1
    Dev -->|Login Credentials| P1
    PM -->|Login Credentials| P1
    P1 <-->|Verify Hashes & Roles| D1
    P1 -->|JWT Session Tokens| Dev
    P1 -->|JWT Session Tokens| PM
    P1 -->|JWT Session Tokens| Admin

    %% Flows: Process 2.0 (Tasks)
    PM -->|Create / Assign Task| P2
    Dev -->|Update Status & Log Actual Hours| P2
    P2 -->|Write Task Records & Timestamps| D2
    P2 -->|Record Status Transition Row| D3
    D2 -->|Fetch Task Details| P2
    P2 -->|Trigger Assignment Notification| P5

    %% Flows: Process 3.0 (Defects)
    Dev -->|Submit Defect Details & Severity| P3
    P3 -->|Store Defect Record| D4
    P3 -->|Trigger Defect Notification| P5
    D4 -->|Defect Counts & Statuses| P3

    %% Flows: Process 4.0 (Metrics Engine)
    D2 -->|Eligible Tasks, Started & Completed Timestamps| P4
    D3 -->|Historical Reopen Transitions| P4
    D4 -->|Recorded Defect Counts| P4
    D1 -->|Active User Roster| P4
    P4 -->|Real-Time Process KPI Cards & Chart Datasets| PM
    P4 -->|Process KPI Cards & Chart Datasets| Admin

    %% Flows: Process 5.0 (Notifications)
    D2 -->|Poll Deadlines & Due Dates| P5
    P5 -->|Write Unread Notification Row| D5
    D5 -->|Fetch Unread Count & Alert Items| Dev
    D5 -->|Fetch Unread Count & Alert Items| PM

    %% Flows: Process 6.0 (Reports & CSV)
    PM -->|Filter Criteria Date, Assignee, Priority| P6
    D2 -->|Filtered Task Rows| P6
    D4 -->|Defect Counts| P6
    P6 -->|Sanitized CSV File Stream & Summary KPIs| PM
```
