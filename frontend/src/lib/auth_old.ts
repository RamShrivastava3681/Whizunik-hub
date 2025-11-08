import Cookies from 'js-cookie';
import axios from 'axios';

import { API_CONFIG } from "../config/api";
const API_BASE_URL = API_CONFIG.BASE_URL;

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Add token to requests
axios.interceptors.request.use((config) => {
  const token = Cookies.get('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth-token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'salesman' | 'evaluator' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

class AuthService {
  async signIn(email: string, password: string): Promise<{ user: User; profile: any }> {
    try {
      const response = await axios.post<AuthResponse>('/auth/login', {
        email,
        password
      });

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // Store token in cookie
        Cookies.set('auth-token', token, { 
          expires: 1, // 1 day
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax'
        });

        return {
          user,
          profile: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        };
      }

      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.response?.data?.message || 'Failed to sign in');
    }
  }

  async signUp(email: string, password: string, username: string, role: 'salesman' | 'evaluator' = 'salesman'): Promise<{ user: User; profile: any }> {
    try {
      const response = await axios.post<AuthResponse>('/auth/register', {
        email,
        password,
        username,
        role
      });

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // Store token in cookie
        Cookies.set('auth-token', token, { 
          expires: 1, // 1 day
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax'
        });

        return {
          user,
          profile: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        };
      }

      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.response?.data?.message || 'Failed to sign up');
    }
  }

  async getCurrentUser(): Promise<{ user: User; profile: any } | null> {
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        return null;
      }

      const response = await axios.get('/auth/profile');

      if (response.data.success && response.data.data) {
        const { user } = response.data.data;
        return {
          user,
          profile: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        };
      }

      return null;
    } catch (error: any) {
      console.error('Get current user error:', error);
      // Clear invalid token
      Cookies.remove('auth-token');
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      // Clear token from cookie
      Cookies.remove('auth-token');
      
      // Optionally call backend logout endpoint if needed
      // await axios.post('/auth/logout');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear the token even if the request fails
      Cookies.remove('auth-token');
    }
  }

  isTokenValid(): boolean {
    const token = Cookies.get('auth-token');
    return !!token;
  }

  getToken(): string | null {
    return Cookies.get('auth-token') || null;
  }

  isAuthenticated(): boolean {
    return this.isTokenValid();
  }
}

export const authService = new AuthService();
