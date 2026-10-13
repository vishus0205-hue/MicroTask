import type {
  User, Task, Defect, NotificationItem, DashboardMetrics,
  MetricDefinition, ReportSummary, SystemInfo
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('microtask_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token on 401 if not already on login
      if (!endpoint.includes('/auth/login')) {
        localStorage.removeItem('microtask_token');
        localStorage.removeItem('microtask_user');
        window.dispatchEvent(new Event('auth_token_expired'));
      }
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // AUTH
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  async changePassword(old_password: string, new_password: string): Promise<{ message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password }),
    });
  }

  // TASKS
  async getTasks(params: Record<string, string | number | boolean | undefined> = {}): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.append(key, String(val));
      }
    });
    return this.request(`/tasks?${query.toString()}`);
  }

  async getTask(id: number): Promise<{ task: Task }> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: Partial<Task>): Promise<{ message: string; task_id: number }> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: number, data: Partial<Task>): Promise<{ message: string }> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: number, status: string, comment?: string, actual_hours?: number): Promise<{
    message: string;
    old_status: string;
    new_status: string;
  }> {
    return this.request(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, comment, actual_hours }),
    });
  }

  async deleteTask(id: number): Promise<{ message: string }> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // DEFECTS
  async getTaskDefects(taskId: number): Promise<{ defects: Defect[] }> {
    return this.request(`/defects/task/${taskId}`);
  }

  async reportDefect(data: { task_id: number; title: string; description: string; severity: string }): Promise<{
    message: string;
    defect_id: number;
  }> {
    return this.request('/defects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDefect(defectId: number, data: Partial<Defect>): Promise<{ message: string }> {
    return this.request(`/defects/${defectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // NOTIFICATIONS
  async getNotifications(limit = 20): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
    return this.request(`/notifications?limit=${limit}`);
  }

  async markNotificationRead(id: number): Promise<{ message: string }> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // METRICS
  async getDashboardMetrics(startDate?: string, endDate?: string): Promise<DashboardMetrics> {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return this.request(`/metrics/dashboard?${query.toString()}`);
  }

  async getMetricDefinitions(): Promise<{ definitions: MetricDefinition[] }> {
    return this.request('/metrics/definitions');
  }

  // REPORTS
  async getReportSummary(params: Record<string, string | number | undefined> = {}): Promise<{ summary: ReportSummary }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request(`/reports/summary?${query.toString()}`);
  }

  async getReportTasks(params: Record<string, string | number | undefined> = {}): Promise<{ tasks: Task[]; count: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request(`/reports/tasks?${query.toString()}`);
  }

  getCsvExportUrl(params: Record<string, string | number | undefined> = {}): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return `/api/reports/export-csv?${query.toString()}`;
  }

  // USERS
  async getUsers(params: Record<string, string | boolean | undefined> = {}): Promise<{ users: User[]; total: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request(`/users?${query.toString()}`);
  }

  async createUser(data: Partial<User> & { password?: string }): Promise<{ message: string; user: User }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: Partial<User> & { password?: string }): Promise<{ message: string }> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deactivateUser(id: number): Promise<{ message: string }> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ADMIN
  async getSettings(): Promise<{ settings: Record<string, { value: string; description: string; updated_at: string }> }> {
    return this.request('/admin/settings');
  }

  async updateSettings(data: Record<string, string>): Promise<{ message: string }> {
    return this.request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSystemInfo(): Promise<{ system: SystemInfo }> {
    return this.request('/admin/system-info');
  }

  async triggerSeed(): Promise<{ message: string }> {
    return this.request('/admin/seed', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
