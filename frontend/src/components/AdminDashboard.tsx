import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PotentialClientsManager } from "@/components/PotentialClientsManager";
import { API_CONFIG } from "../config/api";
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Eye,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Search,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Building2,
  Trash2
} from "lucide-react";

interface AdminDashboardProps {
  userName: string;
  userId: string;
}

interface User {
  _id: string;
  email: string;
  username: string;
  role: 'salesman' | 'evaluator' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    isActive: boolean;
  };
  createdAt: string;
}

interface Application {
  _id: string;
  salesmanId: {
    _id: string;
    username: string;
    email: string;
  };
  clientName: string;
  companyName: string;
  status: string;
  createdAt: string;
  evaluation?: {
    evaluatorId?: {
      _id: string;
      username: string;
    };
    recommendation?: string;
    evaluatedAt?: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  totalSalesmen: number;
  totalEvaluators: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  pendingUsers: number;
}

export function AdminDashboard({ userName, userId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSalesmen: 0,
    totalEvaluators: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    pendingUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch admin data
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = getCookie('auth-token');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      // Fetch users
      const usersResponse = await fetch(`${API_CONFIG.BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('👥 Fetched users:', usersData.data?.length);
        setUsers(usersData.data);
      }

      // Fetch pending users
      const pendingResponse = await fetch(`${API_CONFIG.BASE_URL}/admin/pending-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        console.log('⏳ Fetched pending users:', pendingData.data?.length);
        setPendingUsers(pendingData.data);
      }

      // Fetch applications
      const appsResponse = await fetch(`${API_CONFIG.BASE_URL}/admin/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(appsData.data);
      }

      // Fetch statistics
      const statsResponse = await fetch(`${API_CONFIG.BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
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



  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const token = getCookie('auth-token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleUserApproval = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const token = getCookie('auth-token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ User ${action}d successfully`);
        fetchAdminData(); // Refresh data to update counts and lists
      } else {
        console.error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    }
  };

  const handleUserDelete = async (userId: string, userEmail: string) => {
    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const token = getCookie('auth-token');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ User deleted successfully`);
        fetchAdminData(); // Refresh data to update lists
      } else {
        const errorData = await response.json();
        console.error(`Failed to delete user:`, errorData.message);
        alert(`Failed to delete user: ${errorData.message}`);
      }
    } catch (error) {
      console.error(`Error deleting user:`, error);
      alert('Error deleting user. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const isApproved = user.status === 'approved'; // Only show approved users
    return matchesSearch && matchesRole && isApproved;
  });

  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under-review': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-primary-foreground/80">
          Welcome back, {userName}! Monitor and manage all system activities.
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalApplications > 0 
                ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Application approval rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users ({stats.totalUsers})
          </TabsTrigger>
          <TabsTrigger value="pending-users" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({stats.pendingUsers})
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" />
            Applications ({stats.totalApplications})
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Building2 className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Performance
                </CardTitle>
                <CardDescription>Salesman and Evaluator activity overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Salesmen</p>
                      <p className="text-sm text-muted-foreground">Active employees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stats.totalSalesmen}</p>
                      <p className="text-sm text-green-600">All active</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Evaluators</p>
                      <p className="text-sm text-muted-foreground">Review specialists</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stats.totalEvaluators}</p>
                      <p className="text-sm text-blue-600">Available</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Applications This Month</p>
                      <p className="text-sm text-muted-foreground">New submissions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stats.totalApplications}</p>
                      <p className="text-sm text-purple-600">+15% vs last month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Application Status
                </CardTitle>
                <CardDescription>Current application pipeline status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-bold">{stats.pendingApplications}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Under Review</span>
                    </div>
                    <span className="font-bold">
                      {applications.filter(app => app.status === 'under-review').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Approved</span>
                    </div>
                    <span className="font-bold">{stats.approvedApplications}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Rejected</span>
                    </div>
                    <span className="font-bold">{stats.rejectedApplications}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent System Activity
              </CardTitle>
              <CardDescription>Latest activities across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div key={app._id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {app.salesmanId.username} created application for {app.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.companyName} - {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="salesman">Salesman</SelectItem>
                <SelectItem value="evaluator">Evaluator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAdminData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>Manage all system users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge 
                            className={user.profile.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {user.profile.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {user.status || 'approved'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserStatusToggle(user._id, user.profile.isActive)}
                      >
                        {user.profile.isActive ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUserDelete(user._id, user.email)}
                        disabled={user.role === 'admin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Users Tab */}
        <TabsContent value="pending-users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pending User Registrations
              </CardTitle>
              <CardDescription>
                Review and approve new user registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No pending requests</p>
                  <p className="text-sm text-muted-foreground">All user registration requests have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{user.role}</Badge>
                            <Badge className="bg-orange-100 text-orange-800">
                              Pending Approval
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUserApproval(user._id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUserApproval(user._id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications by client or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Applications Overview</CardTitle>
              <CardDescription>Monitor all applications across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <div key={app._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{app.clientName}</p>
                        <p className="text-sm text-muted-foreground">{app.companyName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            By: {app.salesmanId.username}
                          </span>
                          {app.evaluation?.evaluatorId && (
                            <span className="text-xs text-muted-foreground">
                              • Evaluator: {app.evaluation.evaluatorId.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Potential Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Potential Clients Management
              </CardTitle>
              <CardDescription>
                Manage and track potential clients. You can add individual clients or import multiple clients using CSV files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PotentialClientsManager userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Application trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">Chart visualization will be here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Employee performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-2">Activity chart will be here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="system-name">System Name</Label>
                  <Input id="system-name" defaultValue="WhizUnik Portal" />
                </div>
                
                <div>
                  <Label htmlFor="max-applications">Max Applications per User</Label>
                  <Input id="max-applications" type="number" defaultValue="50" />
                </div>
                
                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>
                
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Edit Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input id="edit-username" defaultValue={selectedUser.username} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" defaultValue={selectedUser.email} />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesman">Salesman</SelectItem>
                    <SelectItem value="evaluator">Evaluator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}