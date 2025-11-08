import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutHeader } from "@/components/ui/layout-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { PotentialClientsManager } from "@/components/PotentialClientsManager";
import { EvaluatorDashboard } from "@/components/EvaluatorDashboard";
import { WhizUnikLogo } from "@/components/ui/WhizUnikLogo";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Building,
  Mail,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import axios from 'axios';

interface DashboardProps {
  userRole: 'salesman' | 'evaluator' | 'admin';
  userName: string;
}

export default function Dashboard({ userRole, userName }: DashboardProps) {
  const [applications, setApplications] = useState([]);
  const [potentialClients, setPotentialClients] = useState([]);
  const navigate = useNavigate();
  const { signOut, user } = useJWTAuth();

  // Debug logging for Dashboard component
  useEffect(() => {
    console.log('📊 Dashboard Component - Mounted with props:');
    console.log('  - userRole:', userRole);
    console.log('  - userName:', userName);
    console.log('  - user from hook:', user);
  }, [userRole, userName, user]);

  // Fetch applications data from backend
  useEffect(() => {
    axios.get('/applications')
      .then(res => {
        console.log('Applications response:', res.data);
        // Handle the response structure: { success: true, data: [...] }
        const applicationsData = res.data.success ? res.data.data : [];
        setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setApplications([]);
      });
  }, []);

  // Fetch potential clients data from backend
  useEffect(() => {
    axios.get('/potential-clients')
      .then(res => {
        console.log('Potential clients response:', res.data);
        // Handle different response formats
        const clientsData = Array.isArray(res.data) ? res.data : 
                           Array.isArray(res.data?.data) ? res.data.data : [];
        setPotentialClients(clientsData);
      })
      .catch(err => {
        console.error('Error fetching potential clients:', err);
        setPotentialClients([]);
      });
  }, []);

  const handleCreateApplication = () => {
    navigate('/create-application');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'under-review': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Ensure applications is always an array before filtering
  const safeApplications = Array.isArray(applications) ? applications : [];
  const safePotentialClients = Array.isArray(potentialClients) ? potentialClients : [];
  // Tab filtering logic
  const approvedApps = safeApplications.filter(app => app.status === 'approved');
  const pendingApps = safeApplications.filter(app => app.status === 'pending' || app.status === 'under-review');

  return (
    <div className="min-h-screen bg-white">
      <LayoutHeader 
        userName={userName}
        userRole={userRole}
        onLogout={signOut} 
      />
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600">
            {userRole === 'salesman' 
              ? 'Manage your trade finance applications and track their progress.' 
              : userRole === 'evaluator'
              ? 'Review and evaluate trade finance applications from the sales team.'
              : 'Administer the system and manage all users and applications.'
            }
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="total" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-16 p-1 bg-blue-100 backdrop-blur-sm rounded-xl border border-blue-300">
            <TabsTrigger 
              value="total" 
              className="flex flex-col items-center justify-center gap-1 h-14 text-xs font-medium text-blue-600 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-200 data-[state=active]:shadow-lg rounded-lg transition-all duration-200 hover:text-blue-700 hover:bg-blue-50"
            >
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Total Applications</span>
                <span className="sm:hidden">Total</span>
              </div>
              <span className="text-lg font-bold text-blue-300">({safeApplications.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="flex flex-col items-center justify-center gap-1 h-14 text-xs font-medium text-blue-600 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-200 data-[state=active]:shadow-lg rounded-lg transition-all duration-200 hover:text-blue-700 hover:bg-blue-50"
            >
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Approved</span>
                <span className="sm:hidden">App.</span>
              </div>
              <span className="text-lg font-bold text-green-300">({approvedApps.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="flex flex-col items-center justify-center gap-1 h-14 text-xs font-medium text-blue-600 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-200 data-[state=active]:shadow-lg rounded-lg transition-all duration-200 hover:text-blue-700 hover:bg-blue-50"
            >
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">Pend.</span>
              </div>
              <span className="text-lg font-bold text-yellow-300">({pendingApps.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="flex flex-col items-center justify-center gap-1 h-14 text-xs font-medium text-blue-600 data-[state=active]:text-blue-800 data-[state=active]:bg-blue-200 data-[state=active]:shadow-lg rounded-lg transition-all duration-200 hover:text-blue-700 hover:bg-blue-50"
            >
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{userRole === 'evaluator' ? 'Evaluations' : 'Clients'}</span>
                <span className="sm:hidden">{userRole === 'evaluator' ? 'Eval' : 'Clients'}</span>
              </div>
              <span className="text-lg font-bold text-purple-300">({safePotentialClients.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Show Evaluator Dashboard for evaluators */}
          {userRole === 'evaluator' ? (
            <EvaluatorDashboard />
          ) : (
            <>
              {/* Total Applications Tab */}
              <TabsContent value="total" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Total Applications</CardTitle>
                          <CardDescription>All applications in the system</CardDescription>
                        </div>
                        {(userRole === 'salesman' || userRole === 'admin') && (
                          <Button onClick={handleCreateApplication} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Application
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6">
                          {safeApplications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No applications in the system.
                            </div>
                          ) : (
                            safeApplications.map((app) => (
                              <div
                                key={app.linkToken}
                                onClick={() => navigate(`/application/${app.linkToken}`)}
                                className="group border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transform hover:-translate-y-1"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                      {(app.clientName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                                        {app.clientName || 'Unknown Client'}
                                      </h3>
                                      <p className="text-gray-600 text-sm">{app.companyName || 'No company'}</p>
                                    </div>
                                  </div>
                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {getStatusIcon(app.status)}
                                    <span className="capitalize">{app.status?.replace('-', ' ') || 'Unknown'}</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-blue-100 rounded-full p-2">
                                      <Building className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.companyName || 'No company'}</p>
                                      <p className="text-xs text-gray-500">Company</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-green-100 rounded-full p-2">
                                      <Mail className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.clientEmail || 'No email'}</p>
                                      <p className="text-xs text-gray-500">Email</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-purple-100 rounded-full p-2">
                                      <Calendar className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500">Created</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500" />
                                    <span className="text-gray-700">ID: {app.linkToken?.slice(-8) || 'N/A'}</span>
                                  </div>
                                  {app.loanAmount && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-green-500" />
                                      <span className="font-semibold text-green-700">
                                        Amount: ${app.loanAmount?.toLocaleString() || '0'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    💼 Click to view full application
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 text-sm font-medium flex items-center gap-1">
                                    View Details <ExternalLink className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* ...existing code for Quick Actions and Authentication Info... */}
                  <div className="lg:col-span-1">
                    {/* Quick Actions and Authentication Info (unchanged) */}
                    {/* ...existing code... */}
                  </div>
                </div>
              </TabsContent>

              {/* Applications Approved Tab */}
              <TabsContent value="approved" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Applications Approved</CardTitle>
                        <CardDescription>Applications that have been approved</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6">
                          {approvedApps.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No approved applications.
                            </div>
                          ) : (
                            approvedApps.map((app) => (
                              <div
                                key={app.linkToken}
                                onClick={() => navigate(`/application/${app.linkToken}`)}
                                className="group border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-green-300 bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transform hover:-translate-y-1"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                      {(app.clientName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-700 transition-colors">
                                        {app.clientName || 'Unknown Client'}
                                      </h3>
                                      <p className="text-gray-600 text-sm">{app.companyName || 'No company'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                    {getStatusIcon(app.status)}
                                    <span className="capitalize">{app.status?.replace('-', ' ') || 'Approved'}</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-blue-100 rounded-full p-2">
                                      <Building className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.companyName || 'No company'}</p>
                                      <p className="text-xs text-gray-500">Company</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-green-100 rounded-full p-2">
                                      <Mail className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.clientEmail || 'No email'}</p>
                                      <p className="text-xs text-gray-500">Email</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-purple-100 rounded-full p-2">
                                      <Calendar className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500">Approved</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-green-500" />
                                    <span className="text-gray-700">ID: {app.linkToken?.slice(-8) || 'N/A'}</span>
                                  </div>
                                  {app.loanAmount && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-green-500" />
                                      <span className="font-semibold text-green-700">
                                        Amount: ${app.loanAmount?.toLocaleString() || '0'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500 bg-green-100 px-3 py-1 rounded-full">
                                    ✅ Approved application - Click to view
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 text-sm font-medium flex items-center gap-1">
                                    View Details <ExternalLink className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-1">{/* ...existing code... */}</div>
                </div>
              </TabsContent>

              {/* Applications Pending Tab */}
              <TabsContent value="pending" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Applications Pending</CardTitle>
                        <CardDescription>Applications that are pending or under review</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6">
                          {pendingApps.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No pending applications.
                            </div>
                          ) : (
                            pendingApps.map((app) => (
                              <div
                                key={app.linkToken}
                                onClick={() => navigate(`/application/${app.linkToken}`)}
                                className="group border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-yellow-300 bg-white hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transform hover:-translate-y-1"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                      {(app.clientName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-yellow-700 transition-colors">
                                        {app.clientName || 'Unknown Client'}
                                      </h3>
                                      <p className="text-gray-600 text-sm">{app.companyName || 'No company'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                    {getStatusIcon(app.status)}
                                    <span className="capitalize">{app.status?.replace('-', ' ') || 'Pending'}</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-blue-100 rounded-full p-2">
                                      <Building className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.companyName || 'No company'}</p>
                                      <p className="text-xs text-gray-500">Company</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-green-100 rounded-full p-2">
                                      <Mail className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.clientEmail || 'No email'}</p>
                                      <p className="text-xs text-gray-500">Email</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <div className="bg-purple-100 rounded-full p-2">
                                      <Calendar className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500">Submitted</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-yellow-500" />
                                    <span className="text-gray-700">ID: {app.linkToken?.slice(-8) || 'N/A'}</span>
                                  </div>
                                  {app.loanAmount && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-yellow-500" />
                                      <span className="font-semibold text-yellow-700">
                                        Amount: ${app.loanAmount?.toLocaleString() || '0'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500 bg-yellow-100 px-3 py-1 rounded-full">
                                    ⏳ Pending review - Click to view
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600 text-sm font-medium flex items-center gap-1">
                                    View Details <ExternalLink className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-1">{/* ...existing code... */}</div>
                </div>
              </TabsContent>

              {/* Total Potential Clients Tab */}
              <TabsContent value="clients" className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                    Potential Clients Management
                  </h2>
                  <p className="text-primary-foreground/80">
                    Create and manage your potential clients database. Add individual clients or import multiple clients using CSV files.
                  </p>
                </div>
                <PotentialClientsManager userId={user?.id || ''} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
