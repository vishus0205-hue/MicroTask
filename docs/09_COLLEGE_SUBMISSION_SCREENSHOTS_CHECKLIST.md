# College Project Submission: Screenshots & Demonstration Checklist

This checklist specifies the exact set of screenshots to capture for your college project report, viva presentation slides, and submission documentation.

---

## Screenshot Checklist

### 1. Login Interface with Quick-Demo Buttons
- **Route:** `http://localhost:5173` (Logged Out)
- **What to Capture:** The modern login card displaying username/password inputs and the three quick-login buttons for Admin (*Dr. Sarah*), Manager (*Alex M.*), and Developer (*Priya S.*).
- **Viva Talking Point:** Demonstrates clean authentication UX, role-based entry points, and quick demonstration access.

---

### 2. Main Executive Dashboard & KPI Metrics
- **Route:** `http://localhost:5173` (Tab: `Main Dashboard`)
- **What to Capture:**
  - The 6 primary KPI cards (Task Completion Rate, Average Cycle Time, Throughput, Overdue Tasks with red alert, Defect Rate, Rework Rate).
  - The date-range preset controls (All Time, Last 30 Days, Last 7 Days).
- **Viva Talking Point:** Proves real-time metric calculation from relational database records rather than hardcoded mock figures.

---

### 3. Recharts Visualizations (Throughput & Status Donut)
- **Route:** `http://localhost:5173` (Tab: `Main Dashboard`)
- **What to Capture:**
  - **Weekly Throughput Chart:** Blue bar chart showing task completion velocity grouped by week.
  - **Task Status Distribution Chart:** Donut chart illustrating proportions of To Do, In Progress, Completed, and Cancelled tasks.
- **Viva Talking Point:** Highlights data-driven engineering throughput tracking using responsive Recharts SVG components.

---

### 4. Workload Distribution & Cycle Time Histogram
- **Route:** `http://localhost:5173` (Tab: `Main Dashboard` - Lower Section)
- **What to Capture:**
  - **Workload Bar Chart:** Horizontal bars comparing active tasks assigned across team members (e.g. John Doe, Priya Sharma, Marcus Chen, Unassigned).
  - **Cycle Time Histogram:** Completed tasks distributed across completion time buckets (<4h, 4-12h, 12-24h, 1-3d, >3d).
- **Viva Talking Point:** Shows resource allocation visibility and lead-time dispersion across deliverables.

---

### 5. Overdue Watchlist & Recent Task Activity
- **Route:** `http://localhost:5173` (Tab: `Main Dashboard` - Bottom)
- **What to Capture:** The red alert card highlighting overdue tasks with past deadlines, alongside the stream of recent task status events.
- **Viva Talking Point:** Illustrates automated deadline monitoring and schedule slippage detection.

---

### 6. Task Management Table & Search / Filter Controls
- **Route:** `http://localhost:5173` (Tab: `Task Management`)
- **What to Capture:** The searchable, paginated task table with priority badges (CRITICAL, HIGH, MEDIUM, LOW), status badges, assignee avatars, and the `Overdue Only` filter toggle activated.
- **Viva Talking Point:** Demonstrates comprehensive task CRUD, multi-criteria filtering, and pagination support.

---

### 7. Task Details View with Status History Audit Trail
- **Route:** `http://localhost:5173` (Click on any task title, e.g. Task #9 *Refactor User Role Management Permissions*)
- **What to Capture:**
  - Detailed task specification card with effort tracking (Est vs Act).
  - **Status History Audit Trail:** Timeline showing historical state transitions (e.g. To Do → In Progress → Completed → Reopened).
- **Viva Talking Point:** Demonstrates the append-only audit ledger used to compute the scientific Rework Rate.

---

### 8. Defect Tracking Sub-Panel on Task
- **Route:** `http://localhost:5173` (Tab: `Task Details` - Left Panel)
- **What to Capture:** Recorded defects showing severity tags (e.g. HIGH, CRITICAL), description, reporter, and "Mark Resolved" button.
- **Viva Talking Point:** Proves direct linkage between software defects and parent engineering tasks.

---

### 9. Software Engineering Metrics Formulas & Reference
- **Route:** `http://localhost:5173` (Tab: `Software Metrics`)
- **What to Capture:** The academic formula cards displaying mathematical LaTeX equations, data treatment guidelines, and live calculated values.
- **Viva Talking Point:** Shows deep understanding of software engineering measurement theory and rigorous handling of cancelled tasks.

---

### 10. Reports & Filtered CSV Export
- **Route:** `http://localhost:5173` (Tab: `Reports & Export`)
- **What to Capture:** Filter parameter dropdowns, summary metric cards, the preview data table, and the green "Export Filtered CSV" button.
- **Viva Talking Point:** Demonstrates automated export generation supporting compliant CSV escaping and user filter criteria.

---

### 11. In-App Notifications Dropdown
- **Route:** Click the Bell icon in the top header.
- **What to Capture:** The notification dropdown popover displaying unread alert counts and itemized alerts (assignments, approaching deadlines, overdue warnings).
- **Viva Talking Point:** Highlights zero-cost in-app notification engine with daily duplicate suppression.

---

### 12. Admin Settings & SQLite Database Diagnostics
- **Route:** `http://localhost:5173` (Tab: `Admin Settings` as Admin)
- **What to Capture:** Database diagnostics showing SQLite 3 engine, file size in KB, table row counts, and the "Reset & Re-seed Sample Data" button.
- **Viva Talking Point:** Demonstrates database architecture awareness and test repeatability.

---

### 13. Pytest Automated Test Execution in Terminal
- **Command:** `.\backend\venv\Scripts\pytest backend\tests -v`
- **What to Capture:** Clean green terminal output showing 17 passed tests in ~1.27 seconds with 100% pass rate.
- **Viva Talking Point:** Verifies software testing rigor, boundary case coverage, and zero regressions.
