# REST API Specification Document

## 1. API Architecture Overview
The **Micro-Task Management System** backend is architected as a RESTful HTTP service communicating via JSON over standard HTTP/1.1 transport.

- **Base URL:** `http://127.0.0.1:5000/api`
- **Authentication Scheme:** Bearer Token via HTTP Header: `Authorization: Bearer <jwt_token>`
- **Response Format:** `application/json; charset=utf-8`
- **CSV Export Format:** `text/csv; charset=utf-8`

---

## 2. Authentication Endpoints

### 2.1 User Login
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
```json
{
  "username": "admin",
  "password": "Demo@12345"
}
```
- **Responses:**
  - `200 OK`:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@microtask.local",
      "full_name": "Dr. Sarah Jenkins",
      "role": "admin"
    }
  }
  ```
  - `401 Unauthorized`: `{"error": "Invalid username/email or password"}`
  - `403 Forbidden`: `{"error": "User account is deactivated. Contact an administrator."}`

### 2.2 Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** Returns authenticated user profile and roles.

### 2.3 Change Password
- **Endpoint:** `POST /api/auth/change-password`
- **Request Body:**
```json
{
  "old_password": "Demo@12345",
  "new_password": "NewSecretPassword#2026"
}
```
- **Response `200 OK`:** `{"message": "Password updated successfully"}`

---

## 3. Task Management Endpoints

### 3.1 List Tasks (with Filters & Pagination)
- **Endpoint:** `GET /api/tasks`
- **Query Parameters:**
  - `search` (string): Text query matching title or description.
  - `status` (`todo` | `in_progress` | `completed` | `cancelled`)
  - `priority` (`low` | `medium` | `high` | `critical`)
  - `assigned_to_id` (integer | `unassigned`)
  - `overdue` (boolean `true`/`false`)
  - `my_tasks_only` (boolean)
  - `sort_by` (`created_at` | `due_date` | `priority` | `status` | `title`)
  - `order` (`asc` | `desc`)
  - `page` (integer, default 1)
  - `limit` (integer, default 20)
- **Response `200 OK`:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Implement JWT Authentication Endpoints",
      "description": "Create login and token verification...",
      "assigned_to_id": 5,
      "assigned_to_name": "Priya Sharma",
      "priority": "high",
      "status": "completed",
      "estimated_hours": 8.0,
      "actual_hours": 7.5,
      "created_at": "2026-09-25T10:00:00Z",
      "started_at": "2026-09-26T10:00:00Z",
      "due_date": "2026-09-29T10:00:00Z",
      "completed_at": "2026-09-27T10:00:00Z",
      "defect_count": 0,
      "is_overdue": false
    }
  ],
  "total": 17,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

### 3.2 Create Task
- **Endpoint:** `POST /api/tasks`
- **Permissions:** Admin, Project Manager
- **Request Body:**
```json
{
  "title": "Optimize SQL Query Indexing",
  "description": "Analyze EXPLAIN QUERY PLAN and add indexes",
  "priority": "medium",
  "assigned_to_id": 5,
  "estimated_hours": 6.0,
  "due_date": "2026-10-20T18:00:00Z"
}
```
- **Response `201 Created`:** `{"message": "Task created successfully", "task_id": 18}`

### 3.3 Get Task Details & Audit Trail
- **Endpoint:** `GET /api/tasks/<task_id>`
- **Response `200 OK`:** Returns full task attributes, plus nested `history` and `defects` arrays.

### 3.4 Update Task Status & Trigger Transition
- **Endpoint:** `PUT /api/tasks/<task_id>/status`
- **Request Body:**
```json
{
  "status": "completed",
  "comment": "All unit tests passing and merged",
  "actual_hours": 8.0
}
```
- **Response `200 OK`:** `{"message": "Task status updated successfully", "old_status": "in_progress", "new_status": "completed"}`

### 3.5 Delete Task (Soft Delete)
- **Endpoint:** `DELETE /api/tasks/<task_id>`
- **Permissions:** Admin, Project Manager
- **Response `200 OK`:** `{"message": "Task deleted successfully"}`

---

## 4. Software Metrics Endpoints

### 4.1 Dashboard Metrics Summary
- **Endpoint:** `GET /api/metrics/dashboard`
- **Query Parameters:** `start_date` (ISO date), `end_date` (ISO date)
- **Response `200 OK`:**
```json
{
  "summary": {
    "completion_rate": 47.06,
    "avg_cycle_time_hours": 30.0,
    "throughput": 8,
    "overdue_count": 2,
    "defect_rate": 25.0,
    "rework_rate": 11.11,
    "total_tasks": 18,
    "eligible_tasks": 17,
    "completed_tasks": 8,
    "in_progress_tasks": 4,
    "todo_tasks": 5,
    "cancelled_tasks": 1
  },
  "workload_distribution": [...],
  "status_distribution": [...],
  "priority_distribution": [...],
  "weekly_throughput": [...],
  "cycle_time_distribution": [...]
}
```

### 4.2 Formal Metric Definitions
- **Endpoint:** `GET /api/metrics/definitions`
- **Response `200 OK`:** Returns full academic formulas, mathematical equations, data treatments, and interpretation notes.

---

## 5. Reports & CSV Export Endpoints

### 5.1 Filtered Reports Summary
- **Endpoint:** `GET /api/reports/summary`
- **Query Parameters:** `date_from`, `date_to`, `status`, `priority`, `assigned_to_id`
- **Response `200 OK`:** Summary totals, estimated vs actual hours, defect count for filtered slice.

### 5.2 Export Clean CSV File
- **Endpoint:** `GET /api/reports/export-csv`
- **Query Parameters:** Active filters matching report view
- **Response `200 OK`:** `Content-Type: text/csv` with `Content-Disposition: attachment; filename=microtask_report_*.csv`
