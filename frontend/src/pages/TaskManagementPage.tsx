import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Clock,
  User,
  Trash2,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Task, TaskPriority, TaskStatus, User as UserModel } from '../types';

interface TaskManagementPageProps {
  onSelectTask: (taskId: number) => void;
  onOpenCreateTask: () => void;
  onOpenEditTask: (task: Task) => void;
  onOpenStatusChange: (task: Task, targetStatus: TaskStatus) => void;
  initialFilter?: string;
  defaultMyTasks?: boolean;
}

export const TaskManagementPage: React.FC<TaskManagementPageProps> = ({
  onSelectTask,
  onOpenCreateTask,
  onOpenEditTask,
  onOpenStatusChange,
  initialFilter,
  defaultMyTasks = false,
}) => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(initialFilter === 'overdue');
  const [myTasksOnly, setMyTasksOnly] = useState<boolean>(defaultMyTasks);

  const [usersList, setUsersList] = useState<UserModel[]>([]);

  useEffect(() => {
    api.getUsers().then((res) => setUsersList(res.users)).catch(() => {});
  }, []);

  useEffect(() => {
    setMyTasksOnly(defaultMyTasks);
  }, [defaultMyTasks]);

  useEffect(() => {
    if (initialFilter === 'overdue') {
      setOverdueOnly(true);
    }
  }, [initialFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assigned_to_id: assigneeFilter || undefined,
        overdue: overdueOnly || undefined,
        my_tasks_only: myTasksOnly || undefined,
        sort_by: 'created_at',
        order: 'desc',
        page,
        limit: 10,
      });
      setTasks(res.tasks);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [page, search, statusFilter, priorityFilter, assigneeFilter, overdueOnly, myTasksOnly]);

  const handleDeleteTask = async (taskId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      await api.deleteTask(taskId);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const getPriorityDot = (p: TaskPriority) => {
    switch (p) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-orange-700">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Low
          </span>
        );
    }
  };

  const getStatusPill = (s: TaskStatus) => {
    switch (s) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            In Progress
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-slate-50 text-slate-600 border border-slate-200">
            To Do
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {myTasksOnly ? 'My Tasks' : 'All Tasks'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {total} total software micro-tasks tracked in repository.
          </p>
        </div>

        {hasRole('admin', 'project_manager') && (
          <button
            onClick={onOpenCreateTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tasks by title or specifications..."
              className="w-full pl-9 pr-3.5 py-2 text-[13px] bg-white/60 border border-black/[0.06] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Quick Segment Toggle (All vs My Tasks) */}
          <div className="inline-flex p-1 rounded-full bg-slate-100 border border-black/[0.04] text-[11px] font-medium shrink-0">
            <button
              onClick={() => {
                setMyTasksOnly(false);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full transition-all ${
                !myTasksOnly ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => {
                setMyTasksOnly(true);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full transition-all ${
                myTasksOnly ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Tasks
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.04] text-[12px]">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white/70 border border-black/[0.06] text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Status: All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white/70 border border-black/[0.06] text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Priority: All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Assignee filter */}
          {!myTasksOnly && (
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/70 border border-black/[0.06] text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              <option value="">Assignee: All</option>
              <option value="unassigned">Unassigned</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          )}

          {/* Overdue toggle pill */}
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(!overdueOnly);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
              overdueOnly
                ? 'bg-red-500 text-white shadow-xs'
                : 'bg-white/60 text-slate-600 border border-black/[0.06] hover:bg-white'
            }`}
          >
            Overdue Deadlines
          </button>

          {/* Clear filters */}
          {(statusFilter || priorityFilter || assigneeFilter || overdueOnly || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
                setAssigneeFilter('');
                setOverdueOnly(false);
                setSearch('');
                setPage(1);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-800 ml-auto transition-colors flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Task List / Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.04] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Task Title</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Effort</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No tasks match the active criteria.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-black/[0.015] transition-colors group">
                    {/* Title */}
                    <td className="py-3.5 px-5 max-w-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectTask(t.id)}
                          className="font-medium text-slate-900 hover:text-blue-600 text-left truncate transition-colors"
                        >
                          {t.title}
                        </button>
                        {t.is_overdue && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold bg-red-50 text-red-600 rounded-full border border-red-100">
                            Overdue
                          </span>
                        )}
                        {t.defect_count > 0 && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold bg-orange-50 text-orange-600 rounded-full">
                            {t.defect_count} defect{t.defect_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {t.assigned_to_name ? t.assigned_to_name.charAt(0) : '?'}
                        </div>
                        <span className="truncate max-w-[120px]">
                          {t.assigned_to_name || <em className="text-slate-400">Unassigned</em>}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">{getPriorityDot(t.priority)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusPill(t.status)}</td>

                    {/* Effort */}
                    <td className="py-3.5 px-4 text-[12px] text-slate-500 tabular-nums">
                      <span className="text-slate-800 font-medium">{t.estimated_hours}h</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span>{t.actual_hours}h</span>
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4">
                      {t.due_date ? (
                        <span className={`text-[12px] ${t.is_overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[12px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick state advance button */}
                        {t.status === 'todo' && (
                          <button
                            onClick={() => onOpenStatusChange(t, 'in_progress')}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-black/[0.04] hover:bg-black/[0.08] rounded-full transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {t.status === 'in_progress' && (
                          <button
                            onClick={() => onOpenStatusChange(t, 'completed')}
                            className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
                          >
                            Done
                          </button>
                        )}
                        {t.status === 'completed' && (
                          <button
                            onClick={() => onOpenStatusChange(t, 'in_progress')}
                            className="px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => onSelectTask(t.id)}
                          title="Inspect Details"
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {hasRole('admin', 'project_manager') && (
                          <>
                            <button
                              onClick={() => onOpenEditTask(t)}
                              title="Edit"
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t.id, t.title)}
                              title="Delete"
                              className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Footer Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-black/[0.04] text-[12px] text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-800 tabular-nums">{tasks.length}</span> of{' '}
            <span className="font-semibold text-slate-800 tabular-nums">{total}</span> tasks
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-lg border border-black/[0.06] bg-white text-slate-600 disabled:opacity-40 hover:bg-black/[0.02]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-slate-700 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-black/[0.06] bg-white text-slate-600 disabled:opacity-40 hover:bg-black/[0.02]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
