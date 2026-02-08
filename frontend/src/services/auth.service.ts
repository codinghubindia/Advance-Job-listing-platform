import api from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';

export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', data);
    return response.data.data; // Backend returns { success, data: { user, token } }
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', credentials);
    return response.data.data; // Backend returns { success, data: { user, token } }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me');
    return response.data.data; // Backend returns { success, data: user }
  },

  // Update profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/api/auth/profile', data);
    return response.data.data; // Backend returns { success, data: user }
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email });
  },
};
