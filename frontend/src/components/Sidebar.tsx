import React from 'react';
import {
  Compass,
  CheckCircle2,
  ListTodo,
  Activity,
  FileText,
  Users,
  Sliders,
  User,
  LogOut,
  Sparkles,
  Command
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, setIsOpen }) => {
  const { user, logout, hasRole } = useAuth();

  const primaryNav = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckCircle2 },
    { id: 'all-tasks', label: 'All Tasks', icon: ListTodo },
  ];

  const analyticsNav = [
    { id: 'metrics', label: 'Software Metrics', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const adminNav = [
    ...(hasRole('admin', 'project_manager')
      ? [{ id: 'team', label: 'Team', icon: Users }]
      : []),
    ...(hasRole('admin')
      ? [{ id: 'settings', label: 'Settings', icon: Sliders }]
      : []),
  ];

  const renderNavGroup = (items: typeof primaryNav, title?: string) => (
    <div className="space-y-0.5">
      {title && (
        <div className="px-3 pb-1 text-[11px] font-medium tracking-wider text-slate-400 uppercase select-none">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setCurrentTab(item.id);
              setIsOpen(false);
            }}
            className={`group relative flex items-center w-full gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ease-out select-none ${
              active
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-transform duration-150 group-hover:scale-105 ${
                active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
              }`}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-60 glass-sidebar transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-black/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-xs">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[14px] font-semibold text-slate-900 tracking-tight block leading-tight">
                MicroTask
              </span>
              <span className="text-[11px] text-slate-400 block font-normal">
                Engineering Metrics
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {renderNavGroup(primaryNav, 'Workspace')}
          {renderNavGroup(analyticsNav, 'Analytics')}
          {adminNav.length > 0 && renderNavGroup(adminNav, 'Management')}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-black/[0.04]">
          <div
            onClick={() => {
              setCurrentTab('profile');
              setIsOpen(false);
            }}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.04] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0 group-hover:bg-slate-300 transition-colors">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-slate-900 truncate leading-tight">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-slate-400 capitalize truncate mt-0.5">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sign Out"
              className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
