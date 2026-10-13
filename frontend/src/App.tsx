import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { TaskManagementPage } from './pages/TaskManagementPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { MetricsPage } from './pages/MetricsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { TaskModal } from './components/TaskModal';
import { StatusChangeModal } from './components/StatusChangeModal';
import { DefectModal } from './components/DefectModal';
import type { Task, TaskStatus } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Selected task for detail view
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTask, setStatusTask] = useState<Task | null>(null);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('in_progress');

  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectTaskId, setDefectTaskId] = useState<number | null>(null);

  // Filter state for navigation from dashboard
  const [tasksFilter, setTasksFilter] = useState<string | undefined>(undefined);

  // Key to force refresh data
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] font-medium text-slate-400 dark:text-zinc-500">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectTask = (id: number) => {
    setSelectedTaskId(id);
    setCurrentTab('task-details');
  };

  const handleNavigateToTasks = (filter?: string) => {
    setTasksFilter(filter);
    setSelectedTaskId(null);
    setCurrentTab('tasks');
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenStatusChange = (task: Task, newStatus: TaskStatus) => {
    setStatusTask(task);
    setTargetStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  const handleOpenReportDefect = (tId: number) => {
    setDefectTaskId(tId);
    setIsDefectModalOpen(true);
  };

  const handleModalSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const getPageInfo = () => {
    switch (currentTab) {
      case 'overview':
        return { title: 'Overview', breadcrumbs: ['Workspace', 'Overview'] };
      case 'tasks':
        return { title: 'Tasks', breadcrumbs: ['Workspace', 'Tasks'] };
      case 'task-details':
        return { title: 'Task Details', breadcrumbs: ['Tasks', `Task #${selectedTaskId}`] };
      case 'metrics':
        return { title: 'Metrics', breadcrumbs: ['Analytics', 'Metrics'] };
      case 'reports':
        return { title: 'Reports', breadcrumbs: ['Analytics', 'Reports'] };
      case 'team':
        return { title: 'Team', breadcrumbs: ['Workspace', 'Team'] };
      case 'profile':
        return { title: 'Profile', breadcrumbs: ['Account', 'Profile'] };
      case 'settings':
        return { title: 'Settings', breadcrumbs: ['Administration', 'Settings'] };
      default:
        return { title: 'Overview', breadcrumbs: ['Workspace', 'Overview'] };
    }
  };

  const { title, breadcrumbs } = getPageInfo();

  return (
    <div className="min-h-screen flex selection:bg-slate-200 dark:selection:bg-blue-600/40 selection:text-slate-900 dark:selection:text-zinc-100">
      {/* 5-Destination Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedTaskId(null);
          setCurrentTab(tab);
        }}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-56">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={title}
          breadcrumbs={breadcrumbs}
          onOpenCreateTask={handleOpenCreateTask}
          onSelectTask={handleSelectTask}
          onNavigateToTab={(tab) => {
            setSelectedTaskId(null);
            setCurrentTab(tab);
          }}
        />

        <main className="flex-1 p-5 sm:p-7 lg:p-8 max-w-6xl w-full mx-auto">
          {/* Subtle Apple-style page entrance animation on tab change */}
          <div key={currentTab} className="page-enter">
            {currentTab === 'overview' && (
              <DashboardPage
                key={`dash-${refreshKey}`}
                onSelectTask={handleSelectTask}
                onNavigateToTasks={handleNavigateToTasks}
                onOpenCreateTask={handleOpenCreateTask}
              />
            )}

            {currentTab === 'tasks' && (
              <TaskManagementPage
                key={`tasks-${refreshKey}`}
                onSelectTask={handleSelectTask}
                onOpenCreateTask={handleOpenCreateTask}
                onOpenEditTask={handleOpenEditTask}
                onOpenStatusChange={handleOpenStatusChange}
                initialFilter={tasksFilter}
                defaultMyTasks={false}
              />
            )}

            {currentTab === 'task-details' && selectedTaskId && (
              <TaskDetailsPage
                key={`detail-${selectedTaskId}-${refreshKey}`}
                taskId={selectedTaskId}
                onBack={() => setCurrentTab('tasks')}
                onOpenEdit={handleOpenEditTask}
                onOpenStatusChange={handleOpenStatusChange}
                onOpenReportDefect={handleOpenReportDefect}
              />
            )}

            {currentTab === 'metrics' && <MetricsPage key={`metrics-${refreshKey}`} />}

            {currentTab === 'reports' && <ReportsPage key={`reports-${refreshKey}`} />}

            {currentTab === 'team' && <TeamManagementPage key={`team-${refreshKey}`} />}

            {currentTab === 'profile' && (
              <ProfilePage key={`prof-${refreshKey}`} onSelectTask={handleSelectTask} />
            )}

            {currentTab === 'settings' && <AdminSettingsPage key={`settings-${refreshKey}`} />}
          </div>
        </main>
      </div>

      {/* Modals with preserved functionality */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={handleModalSuccess}
        task={editingTask}
      />

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={handleModalSuccess}
        task={statusTask}
        targetStatus={targetStatus}
      />

      {defectTaskId && (
        <DefectModal
          isOpen={isDefectModalOpen}
          onClose={() => setIsDefectModalOpen(false)}
          onSuccess={handleModalSuccess}
          taskId={defectTaskId}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
