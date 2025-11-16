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
    console.log('🔗 Axios Request (With Auth):', config.method?.toUpperCase(), config.url);
  } else {
    console.log('🔗 Axios Request (No Auth):', config.method?.toUpperCase(), config.url);
  }
  console.log('🔗 Full URL:', (config.baseURL || '') + (config.url || ''));
  console.log('🔗 Base URL:', config.baseURL);
  console.log('🔗 Request URL:', config.url);
  return config;
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('✅ Axios Response Success:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    // Don't log 404 errors for evaluation endpoints as they're expected when no evaluation exists
    const isEvaluationNotFound = error.config?.url?.includes('/evaluations/application/') && error.response?.status === 404;
    
    if (!isEvaluationNotFound) {
      console.error('❌ Axios Response Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
      console.error('❌ Error details:', error.response?.data);
    } else {
      console.log('ℹ️ No evaluation found (expected):', error.config?.url);
    }
    return Promise.reject(error);
  }
);

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
  status?: 'pending' | 'approved' | 'rejected';
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
  };
  created_at?: string;
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
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log('🔐 Auth Service: Attempting login for:', email);
      
      const response = await axios.post<AuthResponse>('/auth/login', {
        email,
        password
      });

      console.log('🔐 Auth Service: Login response:', response.data);

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // Store token in cookie
        Cookies.set('auth-token', token, { 
          expires: 1, // 1 day
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax'
        });

        // Add timestamps for compatibility
        const userWithTimestamp = {
          ...user,
          created_at: new Date().toISOString()
        };

        console.log('✅ Auth Service: Login successful, user:', userWithTimestamp);

        return {
          user: userWithTimestamp,
          token
        };
      }

      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      console.error('❌ Auth Service: Sign in error:', error);
      throw new Error(error.response?.data?.message || 'Failed to sign in');
    }
  }

  async signUp(email: string, password: string, username: string, role: 'salesman' | 'evaluator' = 'salesman'): Promise<{ user: User; token?: string }> {
    try {
      const response = await axios.post<AuthResponse>('/auth/register', {
        email,
        password,
        username,
        role
      });

      if (response.data.success && response.data.data) {
        // Check if user is immediately approved (shouldn't happen with new system)
        if (response.data.data.token) {
          const { token, user } = response.data.data;
          
          // Store token in cookie
          Cookies.set('auth-token', token, { 
            expires: 1, // 1 day
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax'
          });

          // Add timestamps for compatibility
          const userWithTimestamp = {
            ...user,
            created_at: new Date().toISOString()
          };

          return {
            user: userWithTimestamp,
            token
          };
        } else {
          // User is pending approval - no token returned
          const user = response.data.data.user;
          
          // Add timestamps for compatibility
          const userWithTimestamp = {
            ...user,
            created_at: new Date().toISOString()
          };

          return {
            user: userWithTimestamp
          };
        }
      }

      throw new Error(response.data.message || 'Registration failed');
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.response?.data?.message || 'Failed to sign up');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        console.log('🔍 Auth Service: No token found in cookies');
        return null;
      }

      console.log('🔍 Auth Service: Checking current user with token:', token.substring(0, 20) + '...');
      console.log('🔍 Auth Service: Making request to /auth/me');
      console.log('🔍 Auth Service: Base URL:', axios.defaults.baseURL);
      console.log('🔍 Auth Service: Full URL will be:', axios.defaults.baseURL + '/auth/me');

      const response = await axios.get('/auth/me');

      console.log('🔍 Auth Service: Current user response:', response.data);

      if (response.data.success && response.data.data) {
        const user = response.data.data;
        
        // Add timestamps for compatibility if missing
        const userWithTimestamp = {
          ...user,
          created_at: user.created_at || new Date().toISOString()
        };

        console.log('✅ Auth Service: Current user found:', userWithTimestamp);
        return userWithTimestamp;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Auth Service: Get current user error:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      // Clear invalid token
      Cookies.remove('auth-token');
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🚪 Auth Service: Clearing token immediately');
      
      // Clear token from cookie immediately for instant logout
      Cookies.remove('auth-token');
      
      // Optionally call backend logout endpoint if needed (but don't wait for it)
      // This makes logout instant on the frontend
      setTimeout(async () => {
        try {
          await axios.post('/auth/logout');
        } catch (error) {
          console.log('Backend logout call failed (non-critical):', error);
        }
      }, 0);
      
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
