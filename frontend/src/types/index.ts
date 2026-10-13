export type UserRole = 'admin' | 'project_manager' | 'team_member';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskStatusHistory {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  comment: string | null;
  changed_by_name: string | null;
}

export interface Defect {
  id: number;
  task_id: number;
  reported_by_id: number | null;
  reported_by_name: string | null;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  created_at: string;
  resolved_at: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  assigned_to_username: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_hours: number;
  actual_hours: number;
  created_at: string;
  started_at: string | null;
  due_date: string | null;
  completed_at: string | null;
  defect_count: number;
  is_overdue: boolean;
  history?: TaskStatusHistory[];
  defects?: Defect[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'assignment' | 'reassignment' | 'deadline' | 'overdue' | 'status_change' | 'defect';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface MetricsSummary {
  completion_rate: number;
  avg_cycle_time_hours: number;
  throughput: number;
  overdue_count: number;
  defect_rate: number;
  rework_rate: number;
  total_tasks: number;
  eligible_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  cancelled_tasks: number;
}

export interface WorkloadItem {
  user_id: number | null;
  user_name: string;
  role: string;
  active_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  completed_tasks: number;
}

export interface StatusDistItem {
  status: string;
  key: string;
  count: number;
  color: string;
}

export interface PriorityDistItem {
  priority: string;
  key: string;
  count: number;
  color: string;
}

export interface WeeklyThroughputItem {
  period: string;
  completed_tasks: number;
}

export interface CycleTimeItem {
  range: string;
  count: number;
}

export interface DashboardMetrics {
  summary: MetricsSummary;
  workload_distribution: WorkloadItem[];
  status_distribution: StatusDistItem[];
  priority_distribution: PriorityDistItem[];
  weekly_throughput: WeeklyThroughputItem[];
  cycle_time_distribution: CycleTimeItem[];
  filter: {
    start_date: string | null;
    end_date: string | null;
  };
}

export interface MetricDefinition {
  id: string;
  name: string;
  formula: string;
  unit: string;
  description: string;
  treatment: string;
  interpretation: string;
}

export interface ReportSummary {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  cancelled_tasks: number;
  total_estimated_hours: number;
  total_actual_hours: number;
  overdue_tasks: number;
  total_defects: number;
}

export interface SystemInfo {
  app_name: string;
  version: string;
  database_engine: string;
  database_size_bytes: number;
  database_path: string;
  table_counts: Record<string, number>;
  server_time_utc: string;
}
