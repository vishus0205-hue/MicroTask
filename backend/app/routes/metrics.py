from flask import Blueprint, request, jsonify
from app.models.db import get_db
from app.utils.auth_middleware import jwt_required
from app.metrics.engine import MetricsEngine

metrics_bp = Blueprint("metrics", __name__, url_prefix="/api/metrics")

@metrics_bp.route("/dashboard", methods=["GET"])
@jwt_required
def get_dashboard_metrics():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    db = get_db()
    engine = MetricsEngine(db.get_connection())
    data = engine.calculate_all_metrics(start_date=start_date, end_date=end_date)
    return jsonify(data), 200

@metrics_bp.route("/definitions", methods=["GET"])
@jwt_required
def get_metric_definitions():
    definitions = [
        {
            "id": "completion_rate",
            "name": "Task Completion Rate",
            "formula": "(Completed Eligible Tasks / Total Eligible Tasks) × 100",
            "unit": "%",
            "description": "Measures the proportion of scoped engineering tasks that have reached completion.",
            "treatment": "Cancelled tasks are considered de-scoped/abandoned and are excluded from the denominator. Soft-deleted tasks are completely purged from calculations.",
            "interpretation": "Values above 75% indicate healthy sprint cadence; sustained low values signal scope creep or blocked dependencies."
        },
        {
            "id": "cycle_time",
            "name": "Average Cycle Time",
            "formula": "Σ(completed_at - started_at) / Total Valid Completed Tasks",
            "unit": "hours",
            "description": "Measures the elapsed duration from when an engineer transitions a task to 'In Progress' until it is marked 'Completed'.",
            "treatment": "Only tasks with non-null started_at and completed_at timestamps are included. Invalid negative time deltas are filtered out.",
            "interpretation": "Shorter cycle times indicate lean task sizing and fast pipeline turnaround."
        },
        {
            "id": "throughput",
            "name": "Task Throughput",
            "formula": "Count of tasks completed within the reporting period [T_start, T_end]",
            "unit": "tasks",
            "description": "Rate of deliverable units finished per unit time (daily, weekly, or sprint period).",
            "treatment": "Evaluated against completed_at timestamp within selected filter bounds.",
            "interpretation": "Helps predict team capacity for subsequent planning cycles."
        },
        {
            "id": "overdue_count",
            "name": "Overdue Task Count",
            "formula": "Count of tasks where status ∈ {'todo', 'in_progress'} AND due_date < Current_Timestamp",
            "unit": "tasks",
            "description": "Identifies active work items that have exceeded their target completion deadline.",
            "treatment": "Cancelled and completed tasks are excluded. Relies on UTC timestamp comparison.",
            "interpretation": "Highlights schedule slippage and delivery bottlenecks."
        },
        {
            "id": "defect_rate",
            "name": "Defect Rate",
            "formula": "(Completed Tasks with ≥1 Recorded Defect / Total Completed Tasks) × 100",
            "unit": "%",
            "description": "Quality indicator reflecting how frequently completed deliverables encountered bugs or verification failures.",
            "treatment": "Only completed tasks are evaluated in the denominator. Multi-defect tasks count once in the numerator.",
            "interpretation": "Elevated defect rates indicate need for automated testing or code review rigor."
        },
        {
            "id": "rework_rate",
            "name": "Rework Rate",
            "formula": "(Tasks Reopened After Completion / Tasks Ever Reaching Completion) × 100",
            "unit": "%",
            "description": "Measures the frequency with which supposedly completed tasks are transitioned back to active work.",
            "treatment": "Calculated directly from task_status_history rows where old_status = 'completed' and new_status ∈ {'todo', 'in_progress'}.",
            "interpretation": "High rework rates highlight ambiguous requirements or inadequate acceptance criteria."
        },
        {
            "id": "workload_distribution",
            "name": "Workload Distribution",
            "formula": "Count of active tasks (status ∈ {'todo', 'in_progress'}) grouped by assignee",
            "unit": "tasks / user",
            "description": "Assesses resource balance and allocation across active engineering team members.",
            "treatment": "Includes unassigned queue to highlight backlog items awaiting owner.",
            "interpretation": "Exposes uneven workload bottlenecks and overloaded personnel."
        }
    ]
    return jsonify({"definitions": definitions}), 200
