import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Plus,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  ShieldAlert,
  Search,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { NotificationItem } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  breadcrumbs?: string[];
  onOpenCreateTask: () => void;
  onSelectTask: (taskId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title,
  breadcrumbs = ['Workspace', title],
  onOpenCreateTask,
  onSelectTask,
}) => {
  const { user, hasRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications(12);
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch {
      // Quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (n.link && n.link.startsWith('/tasks/')) {
      const taskId = parseInt(n.link.replace('/tasks/', ''), 10);
      if (!isNaN(taskId)) {
        onSelectTask(taskId);
        setIsNotifOpen(false);
      }
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />;
      case 'deadline':
        return <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
      case 'defect':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />;
      default:
        return <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 glass-header transition-all">
      {/* Left: Mobile toggle & Breadcrumb path */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1 text-slate-500 rounded-lg lg:hidden hover:bg-black/[0.04] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
          <span>MicroTask</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-800 font-semibold">{title}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* New Task Action (Manager / Admin) */}
        {hasRole('admin', 'project_manager') && (
          <button
            onClick={onOpenCreateTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 rounded-full hover:bg-black/[0.04] hover:text-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {/* Frosted Dropdown Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-dialog rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] bg-white/60">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-black/[0.03]">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-[12px] text-slate-400">
                    No new activity alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-2.5 p-3 text-[12px] transition-colors cursor-pointer hover:bg-black/[0.02] ${
                        !n.is_read ? 'bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {getNotifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p className={`truncate font-medium ${!n.is_read ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark read"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Capsule */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
