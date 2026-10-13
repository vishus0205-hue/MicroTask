import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] font-medium text-slate-400">Loading Workspace...</p>
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
    setCurrentTab('all-tasks');
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
      case 'my-tasks':
        return { title: 'My Tasks', breadcrumbs: ['Workspace', 'My Tasks'] };
      case 'all-tasks':
        return { title: 'All Tasks', breadcrumbs: ['Workspace', 'All Tasks'] };
      case 'task-details':
        return { title: 'Task Details', breadcrumbs: ['Tasks', `Task #${selectedTaskId}`] };
      case 'metrics':
        return { title: 'Software Metrics', breadcrumbs: ['Analytics', 'Software Metrics'] };
      case 'reports':
        return { title: 'Reports & Export', breadcrumbs: ['Analytics', 'Reports'] };
      case 'team':
        return { title: 'Team Directory', breadcrumbs: ['Management', 'Team'] };
      case 'profile':
        return { title: 'Profile & Security', breadcrumbs: ['Account', 'Profile'] };
      case 'settings':
        return { title: 'Settings & Diagnostics', breadcrumbs: ['Management', 'Settings'] };
      default:
        return { title: 'Overview', breadcrumbs: ['Workspace', 'Overview'] };
    }
  };

  const { title, breadcrumbs } = getPageInfo();

  return (
    <div className="min-h-screen flex selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedTaskId(null);
          setCurrentTab(tab);
        }}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={title}
          breadcrumbs={breadcrumbs}
          onOpenCreateTask={handleOpenCreateTask}
          onSelectTask={handleSelectTask}
        />

        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <DashboardPage
              key={`dash-${refreshKey}`}
              onSelectTask={handleSelectTask}
              onNavigateToTasks={handleNavigateToTasks}
            />
          )}

          {currentTab === 'my-tasks' && (
            <TaskManagementPage
              key={`my-tasks-${refreshKey}`}
              onSelectTask={handleSelectTask}
              onOpenCreateTask={handleOpenCreateTask}
              onOpenEditTask={handleOpenEditTask}
              onOpenStatusChange={handleOpenStatusChange}
              defaultMyTasks={true}
            />
          )}

          {currentTab === 'all-tasks' && (
            <TaskManagementPage
              key={`all-tasks-${refreshKey}`}
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
              onBack={() => setCurrentTab('all-tasks')}
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
        </main>
      </div>

      {/* Modals */}
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
