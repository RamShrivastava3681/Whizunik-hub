import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutHeader } from "@/components/ui/layout-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";

interface DashboardProps {
  userRole: 'salesman' | 'evaluator';
  userName: string;
}

export default function Dashboard({ userRole, userName }: DashboardProps) {
  const navigate = useNavigate();
  const { signOut, user } = useJWTAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [userRole]); // Removed user dependency to avoid issues

  // Add effect to refresh when window regains focus (when user comes back from another tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchApplications();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userRole]); // Removed user dependency

  const fetchApplications = async () => {
    try {
      if (!user) {
        console.log('No user found, using demo data');
        // Use demo data if no user
        const demoApplications = [
          {
            id: 'demo-1',
            client_name: 'John Smith',
            company_name: 'Smith Trading Co.',
            status: 'in-progress',
            created_at: new Date().toISOString()
          },
          {
            id: 'demo-2',
            client_name: 'Sarah Johnson',
            company_name: 'Johnson Imports',
            status: 'submitted',
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'demo-3',
            client_name: 'Mike Davis',
            company_name: 'Davis Exports',
            status: 'approved',
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        setApplications(demoApplications);
        calculateStats(demoApplications);
        return;
      }

      let query = supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // For salesmen, only show their own applications
      if (userRole === 'salesman') {
        query = query.eq('salesman_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching applications:', error);
        console.error('Error details:', error.message, error.details);
        
        // Fall back to demo data on error
        console.log('Falling back to demo data due to error');
        const demoApplications = [
          {
            id: 'demo-1',
            client_name: 'Demo Client 1',
            company_name: 'Demo Company 1',
            status: 'in-progress',
            created_at: new Date().toISOString()
          }
        ];
        setApplications(demoApplications);
        calculateStats(demoApplications);
        return;
      }

      console.log('Fetched applications:', data); // Debug log
      setApplications(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Use demo data as fallback
      const demoApplications = [
        {
          id: 'demo-fallback',
          client_name: 'Fallback Client',
          company_name: 'Fallback Company',
          status: 'in-progress',
          created_at: new Date().toISOString()
        }
      ];
      setApplications(demoApplications);
      calculateStats(demoApplications);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for visual feedback
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      console.log('Current user:', user);
      
      // Test basic query
      const { data: testData, error: testError } = await supabase
        .from('applications')
        .select('count(*)')
        .limit(1);
      
      console.log('Test query result:', testData, testError);
      
      // Test profile query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id);
      
      console.log('Profile query result:', profileData, profileError);
      
    } catch (error) {
      console.error('Database test error:', error);
    }
  };

  const calculateStats = (apps: any[]) => {
    const inProgress = apps.filter(app => app.status === 'in-progress').length;
    const submitted = apps.filter(app => app.status === 'submitted').length;
    const underReview = apps.filter(app => app.status === 'under-review').length;
    const approved = apps.filter(app => app.status === 'approved').length;
    const rejected = apps.filter(app => app.status === 'rejected').length;

    if (userRole === 'salesman') {
      setStats([
        {
          title: "Total Applications",
          value: apps.length,
          icon: FileText,
          description: "Created this month",
          trend: { value: 12, isPositive: true }
        },
        {
          title: "In Progress",
          value: inProgress,
          icon: Clock,
          description: "Awaiting client completion",
          colorVariant: 'pending' as const
        },
        {
          title: "Approved",
          value: approved,
          icon: CheckCircle,
          description: "Completed successfully",
          colorVariant: 'success' as const
        },
        {
          title: "Under Review",
          value: underReview,
          icon: Users,
          description: "With evaluators",
          colorVariant: 'warning' as const
        }
      ]);
    } else {
      setStats([
        {
          title: "Pending Review",
          value: submitted,
          icon: FileText,
          description: "Applications to review",
          colorVariant: 'warning' as const
        },
        {
          title: "Underwriting",
          value: underReview,
          icon: Clock,
          description: "In underwriting phase",
          colorVariant: 'pending' as const
        },
        {
          title: "Approved Today",
          value: approved,
          icon: CheckCircle,
          description: "Completed evaluations",
          colorVariant: 'success' as const
        },
        {
          title: "Rejected",
          value: rejected,
          icon: XCircle,
          description: "This week",
          trend: { value: -50, isPositive: false }
        }
      ]);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-financial-success';
      case 'rejected': return 'text-destructive';
      case 'under-review': return 'text-financial-warning';
      case 'pending': return 'text-financial-pending';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LayoutHeader 
        userRole={userRole} 
        userName={userName}
        onLogout={signOut} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {userRole === 'salesman' ? 'Sales Dashboard' : 'Evaluation Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'salesman' 
              ? 'Manage your trade finance applications and track client progress'
              : 'Review and evaluate trade finance applications'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {userRole === 'salesman' && (
            <Button 
              variant="financial" 
              className="w-fit"
              onClick={() => navigate('/create-application')}
            >
              <Plus className="w-4 h-4" />
              Create New Application
            </Button>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full lg:w-fit grid-cols-2">
            <TabsTrigger value="recent">Recent Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card className="p-6 bg-gradient-card shadow-card">
              <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
              <div className="space-y-4">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{app.client_name}</p>
                        <p className="text-sm text-muted-foreground">{app.company_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium capitalize ${getStatusColor(app.status)}`}>
                          {app.status.replace('-', ' ')}
                        </span>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      {userRole === 'salesman' 
                        ? 'No applications found. Create your first application!' 
                        : 'No applications to review yet.'
                      }
                    </div>
                    {userRole === 'salesman' && (
                      <div className="space-y-2">
                        <Button 
                          variant="financial" 
                          onClick={() => navigate('/create-application')}
                          className="mb-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Application
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Applications you create will appear here. Make sure you're logged in as a salesman.
                        </p>
                      </div>
                    )}
                    <div className="mt-4 text-xs text-muted-foreground">
                      User ID: {user?.id || 'Not logged in'} | Role: {userRole}
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={testDatabaseConnection}
                          className="text-xs"
                        >
                          Test Database Connection
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="p-6 bg-gradient-card shadow-card">
              <h3 className="text-lg font-semibold mb-4">Performance Analytics</h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Analytics charts will be implemented here</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}