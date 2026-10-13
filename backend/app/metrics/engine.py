from datetime import datetime, timezone
import dateutil.parser

def parse_iso_datetime(dt_str):
    if not dt_str:
        return None
    try:
        # Standardize parsing of ISO strings
        dt = dateutil.parser.isoparse(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

class MetricsEngine:
    """
    Automated Software Engineering Metrics Engine
    Calculates key project monitoring metrics based on real relational database records.
    Provides safe division-by-zero handling, date-range filtering, and validation.
    """

    def __init__(self, db_conn):
        self.conn = db_conn

    def calculate_all_metrics(self, start_date=None, end_date=None):
        """
        Calculate complete metric suite with optional date-range filtering on task creation/completion.
        """
        return {
            "summary": {
                "completion_rate": self.get_task_completion_rate(start_date, end_date),
                "avg_cycle_time_hours": self.get_average_cycle_time(start_date, end_date),
                "throughput": self.get_task_throughput(start_date, end_date),
                "overdue_count": self.get_overdue_task_count(),
                "defect_rate": self.get_defect_rate(start_date, end_date),
                "rework_rate": self.get_rework_rate(),
                "total_tasks": self.get_total_tasks_count(start_date, end_date),
                "eligible_tasks": self.get_eligible_tasks_count(start_date, end_date),
                "completed_tasks": self.get_completed_tasks_count(start_date, end_date),
                "in_progress_tasks": self.get_in_progress_tasks_count(),
                "todo_tasks": self.get_todo_tasks_count(),
                "cancelled_tasks": self.get_cancelled_tasks_count(start_date, end_date),
            },
            "workload_distribution": self.get_workload_distribution(),
            "status_distribution": self.get_status_distribution(start_date, end_date),
            "priority_distribution": self.get_priority_distribution(start_date, end_date),
            "weekly_throughput": self.get_weekly_throughput_series(start_date, end_date),
            "cycle_time_distribution": self.get_cycle_time_breakdown(start_date, end_date),
            "filter": {
                "start_date": start_date,
                "end_date": end_date
            }
        }

    def _apply_date_filter(self, query, params, date_column, start_date, end_date):
        if start_date:
            query += f" AND {date_column} >= ?"
            params.append(start_date)
        if end_date:
            query += f" AND {date_column} <= ?"
            params.append(end_date)
        return query, params

    def get_total_tasks_count(self, start_date=None, end_date=None):
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0"
        params = []
        query, params = self._apply_date_filter(query, params, "created_at", start_date, end_date)
        row = self.conn.execute(query, params).fetchone()
        return row["count"] if row else 0

    def get_eligible_tasks_count(self, start_date=None, end_date=None):
        """
        Eligible tasks: Non-deleted and non-cancelled tasks.
        Cancelled tasks are abandoned scope and not expected to reach completion.
        """
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 AND status != 'cancelled'"
        params = []
        query, params = self._apply_date_filter(query, params, "created_at", start_date, end_date)
        row = self.conn.execute(query, params).fetchone()
        return row["count"] if row else 0

    def get_completed_tasks_count(self, start_date=None, end_date=None):
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 AND status = 'completed'"
        params = []
        query, params = self._apply_date_filter(query, params, "created_at", start_date, end_date)
        row = self.conn.execute(query, params).fetchone()
        return row["count"] if row else 0

    def get_in_progress_tasks_count(self):
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 AND status = 'in_progress'"
        row = self.conn.execute(query).fetchone()
        return row["count"] if row else 0

    def get_todo_tasks_count(self):
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 AND status = 'todo'"
        row = self.conn.execute(query).fetchone()
        return row["count"] if row else 0

    def get_cancelled_tasks_count(self, start_date=None, end_date=None):
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 AND status = 'cancelled'"
        params = []
        query, params = self._apply_date_filter(query, params, "created_at", start_date, end_date)
        row = self.conn.execute(query, params).fetchone()
        return row["count"] if row else 0

    def get_task_completion_rate(self, start_date=None, end_date=None):
        """
        Formula: (Completed eligible tasks / Total eligible tasks) * 100
        Eligible tasks = tasks where is_deleted = 0 and status != 'cancelled'.
        """
        eligible = self.get_eligible_tasks_count(start_date, end_date)
        if eligible == 0:
            return 0.0
        completed = self.get_completed_tasks_count(start_date, end_date)
        rate = (completed / eligible) * 100.0
        return round(rate, 2)

    def get_average_cycle_time(self, start_date=None, end_date=None):
        """
        Average Cycle Time = sum(completed_at - started_at in hours) / count(valid completed tasks)
        Only completed tasks with valid started_at and completed_at timestamps are evaluated.
        """
        query = """
            SELECT started_at, completed_at
            FROM tasks
            WHERE is_deleted = 0
              AND status = 'completed'
              AND started_at IS NOT NULL
              AND completed_at IS NOT NULL
        """
        params = []
        query, params = self._apply_date_filter(query, params, "completed_at", start_date, end_date)
        rows = self.conn.execute(query, params).fetchall()

        if not rows:
            return 0.0

        durations_hours = []
        for row in rows:
            t_start = parse_iso_datetime(row["started_at"])
            t_end = parse_iso_datetime(row["completed_at"])
            if t_start and t_end and t_end >= t_start:
                diff_hours = (t_end - t_start).total_seconds() / 3600.0
                durations_hours.append(diff_hours)

        if not durations_hours:
            return 0.0

        avg_hours = sum(durations_hours) / len(durations_hours)
        return round(avg_hours, 2)

    def get_task_throughput(self, start_date=None, end_date=None):
        """
        Task Throughput: Number of tasks completed during a reporting period.
        """
        query = "SELECT COUNT(*) as count FROM tasks WHERE is_deleted = 0 AND status = 'completed' AND completed_at IS NOT NULL"
        params = []
        query, params = self._apply_date_filter(query, params, "completed_at", start_date, end_date)
        row = self.conn.execute(query, params).fetchone()
        return row["count"] if row else 0

    def get_overdue_task_count(self):
        """
        Overdue Task Count: Number of incomplete (todo, in_progress), non-cancelled tasks
        whose due_date is in the past.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        query = """
            SELECT COUNT(*) as count
            FROM tasks
            WHERE is_deleted = 0
              AND status IN ('todo', 'in_progress')
              AND due_date IS NOT NULL
              AND due_date < ?
        """
        row = self.conn.execute(query, [now_iso]).fetchone()
        return row["count"] if row else 0

    def get_defect_rate(self, start_date=None, end_date=None):
        """
        Defect Rate: (Completed tasks with at least 1 recorded defect / Total eligible completed tasks) * 100
        """
        query_completed = """
            SELECT id FROM tasks
            WHERE is_deleted = 0 AND status = 'completed'
        """
        params_completed = []
        query_completed, params_completed = self._apply_date_filter(query_completed, params_completed, "created_at", start_date, end_date)
        completed_rows = self.conn.execute(query_completed, params_completed).fetchall()

        total_completed = len(completed_rows)
        if total_completed == 0:
            return 0.0

        task_ids = [r["id"] for r in completed_rows]
        placeholders = ",".join("?" for _ in task_ids)
        query_defects = f"""
            SELECT COUNT(DISTINCT task_id) as count
            FROM defects
            WHERE task_id IN ({placeholders})
        """
        row_defects = self.conn.execute(query_defects, task_ids).fetchone()
        tasks_with_defects = row_defects["count"] if row_defects else 0

        rate = (tasks_with_defects / total_completed) * 100.0
        return round(rate, 2)

    def get_rework_rate(self):
        """
        Rework Rate: Number of tasks reopened after completion / Number of tasks that reached completion * 100
        Uses task_status_history transitions.
        """
        # Tasks that have ever reached completion:
        query_reached = """
            SELECT COUNT(DISTINCT task_id) as count
            FROM task_status_history
            WHERE new_status = 'completed'
        """
        row_reached = self.conn.execute(query_reached).fetchone()
        tasks_reached_completed = row_reached["count"] if row_reached else 0

        # Also account for any task currently completed whose creation/history didn't record a history row
        query_curr = "SELECT COUNT(DISTINCT id) as count FROM tasks WHERE status = 'completed' AND is_deleted = 0"
        curr_completed = self.conn.execute(query_curr).fetchone()["count"]
        total_ever_completed = max(tasks_reached_completed, curr_completed)

        if total_ever_completed == 0:
            return 0.0

        # Tasks reopened: old_status was 'completed' and new_status was 'todo' or 'in_progress'
        query_reopened = """
            SELECT COUNT(DISTINCT task_id) as count
            FROM task_status_history
            WHERE old_status = 'completed'
              AND new_status IN ('todo', 'in_progress')
        """
        row_reopened = self.conn.execute(query_reopened).fetchone()
        reopened_count = row_reopened["count"] if row_reopened else 0

        rate = (reopened_count / total_ever_completed) * 100.0
        return round(rate, 2)

    def get_workload_distribution(self):
        """
        Workload Distribution: Active tasks (todo, in_progress) assigned to each team member.
        """
        query = """
            SELECT 
                u.id as user_id,
                u.full_name as user_name,
                u.role as role,
                COUNT(CASE WHEN t.status IN ('todo', 'in_progress') AND t.is_deleted = 0 THEN 1 END) as active_tasks,
                COUNT(CASE WHEN t.status = 'in_progress' AND t.is_deleted = 0 THEN 1 END) as in_progress_tasks,
                COUNT(CASE WHEN t.status = 'todo' AND t.is_deleted = 0 THEN 1 END) as todo_tasks,
                COUNT(CASE WHEN t.status = 'completed' AND t.is_deleted = 0 THEN 1 END) as completed_tasks
            FROM users u
            LEFT JOIN tasks t ON u.id = t.assigned_to_id
            WHERE u.is_active = 1
            GROUP BY u.id, u.full_name, u.role
            ORDER BY active_tasks DESC
        """
        rows = self.conn.execute(query).fetchall()
        result = []
        for r in rows:
            result.append({
                "user_id": r["user_id"],
                "user_name": r["user_name"],
                "role": r["role"],
                "active_tasks": r["active_tasks"],
                "in_progress_tasks": r["in_progress_tasks"],
                "todo_tasks": r["todo_tasks"],
                "completed_tasks": r["completed_tasks"],
            })

        # Also check unassigned active tasks
        unassigned_query = """
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE assigned_to_id IS NULL 
              AND status IN ('todo', 'in_progress') 
              AND is_deleted = 0
        """
        unassigned_row = self.conn.execute(unassigned_query).fetchone()
        unassigned_count = unassigned_row["count"] if unassigned_row else 0
        if unassigned_count > 0:
            result.append({
                "user_id": None,
                "user_name": "Unassigned",
                "role": "none",
                "active_tasks": unassigned_count,
                "in_progress_tasks": 0,
                "todo_tasks": unassigned_count,
                "completed_tasks": 0,
            })
        return result

    def get_status_distribution(self, start_date=None, end_date=None):
        query = """
            SELECT status, COUNT(*) as count
            FROM tasks
            WHERE is_deleted = 0
        """
        params = []
        query, params = self._apply_date_filter(query, params, "created_at", start_date, end_date)
        query += " GROUP BY status"
        rows = self.conn.execute(query, params).fetchall()

        dist = {"todo": 0, "in_progress": 0, "completed": 0, "cancelled": 0}
        for r in rows:
            if r["status"] in dist:
                dist[r["status"]] = r["count"]

        return [
            {"status": "To Do", "key": "todo", "count": dist["todo"], "color": "#64748b"},
            {"status": "In Progress", "key": "in_progress", "count": dist["in_progress"], "color": "#3b82f6"},
            {"status": "Completed", "key": "completed", "count": dist["completed"], "color": "#10b981"},
            {"status": "Cancelled", "key": "cancelled", "count": dist["cancelled"], "color": "#ef4444"},
        ]

    def get_priority_distribution(self, start_date=None, end_date=None):
        query = """
            SELECT priority, COUNT(*) as count
            FROM tasks
            WHERE is_deleted = 0
        """
        params = []
        query, params = self._apply_date_filter(query, params, "created_at", start_date, end_date)
        query += " GROUP BY priority"
        rows = self.conn.execute(query, params).fetchall()

        dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for r in rows:
            if r["priority"] in dist:
                dist[r["priority"]] = r["count"]

        return [
            {"priority": "Low", "key": "low", "count": dist["low"], "color": "#10b981"},
            {"priority": "Medium", "key": "medium", "count": dist["medium"], "color": "#f59e0b"},
            {"priority": "High", "key": "high", "count": dist["high"], "color": "#f97316"},
            {"priority": "Critical", "key": "critical", "count": dist["critical"], "color": "#ef4444"},
        ]

    def get_weekly_throughput_series(self, start_date=None, end_date=None):
        """
        Returns weekly task completion counts over time for charting.
        Groups completed tasks by ISO week (YYYY-Www).
        """
        query = """
            SELECT completed_at
            FROM tasks
            WHERE is_deleted = 0
              AND status = 'completed'
              AND completed_at IS NOT NULL
        """
        params = []
        query, params = self._apply_date_filter(query, params, "completed_at", start_date, end_date)
        query += " ORDER BY completed_at ASC"
        rows = self.conn.execute(query, params).fetchall()

        week_counts = {}
        for r in rows:
            dt = parse_iso_datetime(r["completed_at"])
            if dt:
                week_key = dt.strftime("%Y-W%U")
                display_label = dt.strftime("Week %U (%b)")
                if week_key not in week_counts:
                    week_counts[week_key] = {"label": display_label, "count": 0}
                week_counts[week_key]["count"] += 1

        series = []
        for k in sorted(week_counts.keys()):
            series.append({
                "period": week_counts[k]["label"],
                "completed_tasks": week_counts[k]["count"]
            })
        return series

    def get_cycle_time_breakdown(self, start_date=None, end_date=None):
        """
        Returns bucketed cycle times: < 4h, 4-12h, 12-24h, 1-3d, > 3d
        """
        query = """
            SELECT started_at, completed_at
            FROM tasks
            WHERE is_deleted = 0
              AND status = 'completed'
              AND started_at IS NOT NULL
              AND completed_at IS NOT NULL
        """
        params = []
        query, params = self._apply_date_filter(query, params, "completed_at", start_date, end_date)
        rows = self.conn.execute(query, params).fetchall()

        buckets = {
            "< 4 Hours": 0,
            "4 - 12 Hours": 0,
            "12 - 24 Hours": 0,
            "1 - 3 Days": 0,
            "> 3 Days": 0
        }

        for r in rows:
            t_start = parse_iso_datetime(r["started_at"])
            t_end = parse_iso_datetime(r["completed_at"])
            if t_start and t_end and t_end >= t_start:
                diff_hours = (t_end - t_start).total_seconds() / 3600.0
                if diff_hours < 4:
                    buckets["< 4 Hours"] += 1
                elif diff_hours < 12:
                    buckets["4 - 12 Hours"] += 1
                elif diff_hours < 24:
                    buckets["12 - 24 Hours"] += 1
                elif diff_hours < 72:
                    buckets["1 - 3 Days"] += 1
                else:
                    buckets["> 3 Days"] += 1

        return [{"range": k, "count": v} for k, v in buckets.items()]
