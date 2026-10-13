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
  ChevronRight,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import type { NotificationItem } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  breadcrumbs?: string[];
  onOpenCreateTask: () => void;
  onSelectTask: (taskId: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title,
  breadcrumbs = ['Workspace', title],
  onOpenCreateTask,
  onSelectTask,
  onNavigateToTab,
}) => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications(10);
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
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 glass-header transition-colors">
      {/* Left: Mobile menu button & Restrained Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1 text-slate-500 dark:text-zinc-400 rounded-lg lg:hidden hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 dark:text-zinc-500">
          <span>MicroTask</span>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
          <span className="text-slate-800 dark:text-zinc-100 font-semibold">{title}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Primary Action: New Task */}
        {hasRole('admin', 'project_manager') && (
          <button
            onClick={onOpenCreateTask}
            className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}

        {/* Theme Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-press p-2 text-slate-500 dark:text-zinc-400 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-zinc-100 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="p-2 text-slate-500 dark:text-zinc-400 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-zinc-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-zinc-900" />
            )}
          </button>

          {isNotifOpen && (
            <div className="dialog-enter absolute right-0 mt-2 w-80 sm:w-88 glass-dropdown overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.05] dark:border-white/[0.08] bg-white/70 dark:bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-zinc-100">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-black/[0.03] dark:divide-white/[0.05]">
                {notifications.length === 0 ? (
                  <div className="py-6 px-4 text-center text-[12px] text-slate-400 dark:text-zinc-500">
                    No new activity alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-2.5 p-3 text-[12px] transition-colors cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.04] ${
                        !n.is_read ? 'bg-blue-50/25 dark:bg-blue-950/20' : 'text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {getNotifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p className={`truncate font-medium ${!n.is_read ? 'text-slate-900 dark:text-zinc-100 font-semibold' : 'text-slate-700 dark:text-zinc-300'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark read"
                          className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors shrink-0"
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

        {/* Compact Profile & Preferences Menu */}
        <div className="relative pl-1" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
            aria-label="User profile menu"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-zinc-700 text-white flex items-center justify-center text-xs font-semibold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500 mr-0.5" />
          </button>

          {isProfileOpen && (
            <div className="dialog-enter absolute right-0 mt-2 w-56 glass-dropdown p-1.5 z-50">
              {/* User Identity Header */}
              <div className="px-2.5 py-2 border-b border-black/[0.05] dark:border-white/[0.08] mb-1">
                <p className="text-[12px] font-semibold text-slate-900 dark:text-zinc-100 truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1">
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Navigation Options */}
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onNavigateToTab?.('profile');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-md transition-colors text-left"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                <span>Account Profile</span>
              </button>

              {/* Admin-only Diagnostics & Settings */}
              {hasRole('admin') && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigateToTab?.('settings');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-md transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                  <span>Admin Settings</span>
                </button>
              )}

              <div className="h-px bg-black/[0.05] dark:bg-white/[0.08] my-1" />

              {/* Logout Action */}
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
