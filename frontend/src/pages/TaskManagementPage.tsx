import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
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
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    initialFilter === 'active' ? 'in_progress' : initialFilter === 'completed' ? 'completed' : ''
  );
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
    } else if (initialFilter === 'completed') {
      setStatusFilter('completed');
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
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 shrink-0" /> Low
          </span>
        );
    }
  };

  const getStatusPill = (s: TaskStatus) => {
    switch (s) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            In Progress
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            To Do
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header section with segmented view toggle & primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Tasks
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {total} {myTasksOnly ? 'personal tasks' : 'tasks in workspace'}. Search, filter, and advance workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle: All Tasks vs My Tasks */}
          <div className="inline-flex p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[12px] font-medium text-slate-600 dark:text-zinc-400">
            <button
              onClick={() => {
                setMyTasksOnly(false);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                !myTasksOnly
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => {
                setMyTasksOnly(true);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md transition-colors ${
                myTasksOnly
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              My Tasks
            </button>
          </div>

          {/* New Task Action */}
          {hasRole('admin', 'project_manager') && (
            <button
              onClick={onOpenCreateTask}
              className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 rounded-lg focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-[12px] rounded-lg bg-black/[0.02] dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-medium focus:outline-hidden"
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
            className="px-2.5 py-1.5 text-[12px] rounded-lg bg-black/[0.02] dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-medium focus:outline-hidden"
          >
            <option value="">Priority: All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Assignee filter (for managers & admins) */}
          {!myTasksOnly && (
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-[12px] rounded-lg bg-black/[0.02] dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 font-medium focus:outline-hidden"
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

          {/* Overdue filter pill */}
          <button
            type="button"
            onClick={() => {
              setOverdueOnly(!overdueOnly);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
              overdueOnly
                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                : 'bg-black/[0.02] dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border border-black/[0.06] dark:border-white/[0.08] hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Overdue
          </button>

          {/* Clear filters trigger */}
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
              className="text-[11px] text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 font-medium ml-auto"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Task Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06] text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider bg-black/[0.01] dark:bg-white/[0.02]">
                <th className="py-2.5 px-4">Task</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Due</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.03] transition-colors group">
                    {/* Title */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectTask(t.id)}
                          className="font-medium text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 text-left truncate transition-colors"
                        >
                          {t.title}
                        </button>
                        {t.is_overdue && (
                          <span className="shrink-0 px-1.5 py-0.2 text-[9px] font-medium bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 rounded">
                            Overdue
                          </span>
                        )}
                        {t.defect_count > 0 && (
                          <span className="shrink-0 px-1.5 py-0.2 text-[9px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded">
                            {t.defect_count} defect{t.defect_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                          {t.description}
                        </p>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {t.assigned_to_name ? t.assigned_to_name.charAt(0) : '?'}
                        </div>
                        <span className="truncate max-w-[110px]">
                          {t.assigned_to_name || <span className="text-slate-400 dark:text-zinc-500">Unassigned</span>}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">{getPriorityDot(t.priority)}</td>

                    {/* Status */}
                    <td className="py-3 px-3">{getStatusPill(t.status)}</td>

                    {/* Due date */}
                    <td className="py-3 px-3">
                      {t.due_date ? (
                        <span className={`text-[12px] tabular-nums ${t.is_overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-zinc-400'}`}>
                          {new Date(t.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-zinc-600 text-[12px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Inline status advance */}
                        {t.status === 'todo' && (
                          <button
                            onClick={() => onOpenStatusChange(t, 'in_progress')}
                            className="px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] rounded transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {t.status === 'in_progress' && (
                          <button
                            onClick={() => onOpenStatusChange(t, 'completed')}
                            className="px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded transition-colors"
                          >
                            Done
                          </button>
                        )}
                        {t.status === 'completed' && (
                          <button
                            onClick={() => onOpenStatusChange(t, 'in_progress')}
                            className="px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded transition-colors"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => onSelectTask(t.id)}
                          title="View Details"
                          className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {hasRole('admin', 'project_manager') && (
                          <>
                            <button
                              onClick={() => onOpenEditTask(t)}
                              title="Edit"
                              className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t.id, t.title)}
                              title="Delete"
                              className="p-1 text-slate-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[12px] text-slate-400 dark:text-zinc-500">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{tasks.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{total}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-slate-700 dark:text-zinc-300 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
