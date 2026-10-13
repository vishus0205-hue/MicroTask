import React from 'react';
import {
  Compass,
  CheckSquare,
  Activity,
  FileText,
  Users,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, setIsOpen }) => {
  const { hasRole } = useAuth();

  // Exactly 5 primary destinations as requested
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'metrics', label: 'Metrics', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-56 glass-sidebar transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center px-5 h-14 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100 tracking-tight block leading-tight">
                MicroTask
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-normal leading-none mt-0.5">
                Metrics Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* 5 Primary Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id || (item.id === 'tasks' && currentTab === 'task-details');
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 select-none ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white/10 dark:text-white dark:border dark:border-white/10 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-white' : 'text-slate-400 dark:text-zinc-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Minimal System Info Tag */}
        <div className="px-5 py-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-between">
          <span>v2.0 • Live Telemetry</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </aside>
    </>
  );
};

