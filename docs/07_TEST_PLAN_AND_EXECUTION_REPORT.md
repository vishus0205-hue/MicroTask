# Software Testing Plan & Automated Execution Report

## 1. Testing Strategy Overview
Quality assurance for the **Micro-Task Management System** combines unit testing, integration testing, boundary analysis, and security verification.

- **Test Framework:** Pytest 9.x
- **Test Database:** In-memory SQLite (`:memory:`) ensuring complete test isolation and zero state pollution between executions.
- **Execution Target:** `pytest backend/tests -v`

---

## 2. Test Cases Specification

| Test ID | Module | Scenario / Description | Expected Result | Status |
|---|---|---|---|---|
| **TC-AUTH-01** | Auth | Login with valid credentials (`admin_test`, `Password123`) | HTTP 200, JWT token issued, user role `admin` | **PASSED** |
| **TC-AUTH-02** | Auth | Login with invalid password | HTTP 401 Unauthorized with descriptive error | **PASSED** |
| **TC-AUTH-03** | Auth | Access protected `/api/auth/me` with valid Bearer token | HTTP 200, returns active session user payload | **PASSED** |
| **TC-AUTH-04** | Auth | Access protected endpoint without Authorization header | HTTP 401 Unauthorized | **PASSED** |
| **TC-AUTH-05** | RBAC | Developer role attempts to POST to `/api/users` (Admin only) | HTTP 403 Forbidden | **PASSED** |
| **TC-TASK-01** | Tasks | Project Manager creates new task with priority and deadline | HTTP 201 Created with new task ID | **PASSED** |
| **TC-TASK-02** | Tasks | Developer role attempts to POST to `/api/tasks` | HTTP 403 Forbidden | **PASSED** |
| **TC-TASK-03** | Lifecycle | Transition task from `todo` to `in_progress` | HTTP 200, `started_at` populated with UTC timestamp | **PASSED** |
| **TC-TASK-04** | Lifecycle | Transition task from `in_progress` to `completed` | HTTP 200, `completed_at` populated, actual hours logged | **PASSED** |
| **TC-TASK-05** | Audit Trail | Check `task_status_history` rows after status progression | Sequential history records logged with author & timestamp | **PASSED** |
| **TC-TASK-06** | Rework | Reopen completed task (`completed` → `in_progress`) | HTTP 200, status reset to `in_progress`, rework logged | **PASSED** |
| **TC-TASK-07** | Deletion | Manager issues soft delete on task (`is_deleted = 1`) | HTTP 200, task excluded from active task queries | **PASSED** |
| **TC-METR-01** | Metrics | Calculation on empty database (0 tasks) | Safe 0.0 defaults, no `ZeroDivisionError` raised | **PASSED** |
| **TC-METR-02** | Metrics | Completion rate with cancelled task present | Cancelled task excluded from denominator, exact 50.0% | **PASSED** |
| **TC-METR-03** | Metrics | Average cycle time calculation on completed items | Delta arithmetic evaluated in hours: exact 15.0 hrs | **PASSED** |
| **TC-METR-04** | Metrics | Overdue task count with past vs future deadlines | Exactly incomplete tasks with past deadlines counted (2) | **PASSED** |
| **TC-METR-05** | Metrics | Defect rate & Rework rate on multi-defect tasks | Distinct task counting: exact 50% defect, 25% rework | **PASSED** |
| **TC-NOTF-01** | Alerts | Task assigned to developer triggers notification | Unread notification created, marked read successfully | **PASSED** |
| **TC-REPO-01** | Reports | Filtered task summary and CSV data export | HTTP 200, `text/csv` stream with quoted commas and headers | **PASSED** |

---

## 3. Actual Automated Pytest Execution Output

```text
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\91928\OneDrive\Desktop\MicroTask
collected 17 items

backend\tests\test_auth.py::test_login_success PASSED                    [  5%]
backend\tests\test_auth.py::test_login_invalid_password PASSED           [ 11%]
backend\tests\test_auth.py::test_me_endpoint_authenticated PASSED         [ 17%]
backend\tests\test_auth.py::test_me_endpoint_unauthenticated PASSED       [ 23%]
backend\tests\test_auth.py::test_role_based_access_admin_only PASSED      [ 29%]
backend\tests\test_metrics.py::test_metrics_empty_database_safe_defaults PASSED [ 35%]
backend\tests\test_metrics.py::test_task_completion_rate_and_cancelled_treatment PASSED [ 41%]
backend\tests\test_metrics.py::test_average_cycle_time_calculation PASSED [ 47%]
backend\tests\test_metrics.py::test_overdue_task_count PASSED            [ 52%]
backend\tests\test_metrics.py::test_defect_rate_and_rework_rate PASSED   [ 58%]
backend\tests\test_notifications.py::test_notification_flow PASSED       [ 64%]
backend\tests\test_reports.py::test_report_summary_and_csv_export PASSED  [ 70%]
backend\tests\test_tasks.py::test_task_creation_by_pm PASSED             [ 76%]
backend\tests\test_tasks.py::test_task_creation_forbidden_for_team_member PASSED [ 82%]
backend\tests\test_tasks.py::test_task_status_transition_and_timestamps PASSED [ 88%]
backend\tests\test_tasks.py::test_reopen_completed_task_rework PASSED    [ 94%]
backend\tests\test_tasks.py::test_delete_task_soft_delete PASSED         [100%]

============================= 17 passed in 1.27s ==============================
```

- **Pass Rate:** 100% (17 / 17 passed)
- **Execution Time:** 1.27 seconds
- **Zero Failures / Zero Errors / Zero Warnings**
