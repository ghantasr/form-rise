import client from './client';
import type { User } from '../types/auth';

export const authApi = {
  sendOtp: (email: string) =>
    client.post('/auth/send-otp', { email }),

  verifyOtp: (email: string, code: string) =>
    client.post<{ accessToken: string; user: User }>('/auth/verify-otp', { email, code }),

  refresh: () =>
    client.post<{ accessToken: string; user: User }>('/auth/refresh'),

  logout: () =>
    client.post('/auth/logout'),

  me: () =>
    client.get<User>('/auth/me'),

  googleLogin: (idToken: string) =>
    client.post<{ accessToken: string; user: User }>('/auth/google', { idToken }),
};
