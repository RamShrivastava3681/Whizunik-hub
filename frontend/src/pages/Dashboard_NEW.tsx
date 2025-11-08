import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutHeader } from "@/components/ui/layout-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus
} from "lucide-react";
import axios from "axios";

interface DashboardProps {
  userRole: 'salesman' | 'evaluator';
  userName: string;
}

export default function Dashboard({ userRole, userName }: DashboardProps) {
  const navigate = useNavigate();
  const { signOut, user } = useJWTAuth();
  const [applications, setApplications] = useState([]);

  // Mock data for demonstration
  const mockStats = [
    {
      title: "Total Applications",
      value: "24",
      description: "All applications in system",
      icon: FileText,
      trend: { value: 12, isPositive: true, label: "vs last month" }
    },
    {
      title: "Pending Review",
      value: "8",
      description: "Awaiting evaluation",
      icon: Clock,
      trend: { value: 3, isPositive: false, label: "vs last week" }
    },
    {
      title: "Approved",
      value: "12",
      description: "Successfully approved",
      icon: CheckCircle,
      trend: { value: 8, isPositive: true, label: "vs last month" }
    },
    {
      title: "Active Users",
      value: "6",
      description: "Team members online",
      icon: Users,
      trend: { value: 2, isPositive: true, label: "vs yesterday" }
    }
  ];

  useEffect(() => {
    axios.get('/applications')
      .then(res => setApplications(res.data.data.applications))
      .catch(() => setApplications([]));
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
              : 'Review and evaluate trade finance applications from the sales team.'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>
                    {userRole === 'salesman' 
                      ? 'Your latest trade finance applications' 
                      : 'Applications pending your review'
                    }
                  </CardDescription>
                </div>
                {userRole === 'salesman' && (
                  <Button onClick={handleCreateApplication} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Application
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {userRole === 'salesman' 
                        ? 'No applications yet. Create your first application!' 
                        : 'No applications to review at the moment.'
                      }
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{app.client_name}</div>
                          <div className="text-sm text-muted-foreground">{app.company_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          <span className="text-sm font-medium capitalize">
                            {app.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {userRole === 'salesman' ? (
                  <>
                    <Button onClick={handleCreateApplication} className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Application
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      View All Applications
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Client Directory
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full justify-start gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Reviews
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Approved Applications
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      All Applications
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Authentication Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>JWT Authentication Active</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Login Method</div>
                  <div className="text-muted-foreground">JWT Token</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">User ID</div>
                  <div className="text-muted-foreground">{user?.id}</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Role</div>
                  <div className="text-muted-foreground capitalize">{userRole}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
