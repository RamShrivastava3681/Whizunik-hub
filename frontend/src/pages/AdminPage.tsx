import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";
import { WhizUnikLogo } from "@/components/ui/WhizUnikLogo";

import { API_CONFIG } from "../config/api";
const API_BASE_URL = API_CONFIG.BASE_URL;

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for existing token first for instant response
      const existingToken = getCookie('auth-token');
      
      if (!existingToken) {
        // No token, immediately set not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        console.log('🚫 Admin: No token found - immediate logout');
        return;
      }
      
      setLoading(true);
      
      // Check for current user with existing token
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${existingToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.role === 'admin') {
          setUser({
            id: data.data.id,
            username: data.data.username,
            role: data.data.role
          });
          setIsAuthenticated(true);
          console.log('✅ Admin: User authenticated', data.data);
        } else {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Admin Auth check error:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get cookie
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const handleLogin = (token: string, userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear cookie instead of localStorage
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setIsAuthenticated(false);
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-blue-600 animate-pulse" />
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <WhizUnikLogo size="sm" />
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-500">Administrative Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard 
          userName={user?.username || 'Admin'} 
          userId={user?.id || ''} 
        />
      </main>
    </div>
  );
};

export default AdminPage;