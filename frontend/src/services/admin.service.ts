import api from './api';
import { HRRequest, HRRequestStats, User, UserStats } from '@/types';

export const adminService = {
  // HR Request Management
  async getPendingHRRequests(): Promise<HRRequest[]> {
    const response = await api.get('/api/admin/hr-requests');
    return response.data.data.requests; // Backend: { success, data: { count, requests } }
  },

  async getAllHRRequests(status?: string): Promise<HRRequest[]> {
    const params = status ? { status } : {};
    const response = await api.get('/api/admin/hr-requests/all', { params });
    return response.data.data.requests; // Backend: { success, data: { count, requests } }
  },

  async getHRRequestStats(): Promise<HRRequestStats> {
    const response = await api.get('/api/admin/hr-requests/stats');
    return response.data.data; // Backend: { success, data: {...} }
  },

  async approveHRRequest(
    requestId: string,
    data?: { companyName?: string; notes?: string; createCompany?: boolean }
  ): Promise<void> {
    await api.post(`/api/admin/hr-requests/${requestId}/approve`, data);
  },

  async rejectHRRequest(
    requestId: string,
    data: { reason: string; notes?: string }
  ): Promise<void> {
    await api.post(`/api/admin/hr-requests/${requestId}/reject`, data);
  },

  // User Management
  async getAllUsers(filters?: { role?: string; status?: string }): Promise<User[]> {
    const response = await api.get('/api/admin/users', { params: filters });
    return response.data.data.users; // Backend: { success, data: { count, users } }
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/api/admin/users/stats');
    return response.data.data; // Backend: { success, data: {...} }
  },

  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await api.put(`/api/admin/users/${userId}/role`, { role });
    return response.data.data; // Backend: { success, data: {...} }
  },

  async suspendUser(userId: string, reason: string): Promise<void> {
    await api.post(`/api/admin/users/${userId}/suspend`, { reason });
  },

  async deleteUser(userId: string, reason: string): Promise<void> {
    await api.delete(`/api/admin/users/${userId}`, { data: { reason } });
  },
};
