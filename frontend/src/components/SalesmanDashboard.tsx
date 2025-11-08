import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PotentialClientsManager } from "@/components/PotentialClientsManager";
import { 
  FileText, 
  Users, 
  Plus,
  Eye,
  Building2,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Filter
} from "lucide-react";

interface SalesmanDashboardProps {
  userName: string;
  userId: string;
}

export function SalesmanDashboard({ userName, userId }: SalesmanDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("clients");

  const handleCreateApplication = () => {
    navigate('/create-application');
  };

  const handleViewApplications = () => {
    navigate('/applications');
  };

  // Mock data for quick stats
  const stats = {
    totalClients: 15,
    activeDeals: 8,
    monthlyRevenue: 125000,
    pendingApplications: 3
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-primary-foreground/80">
          Manage your potential clients, create applications, and track your sales progress.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Potential clients in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              Deals in progress
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
              This month's target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Potential Clients
          </TabsTrigger>
          <TabsTrigger value="create-application" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Application
          </TabsTrigger>
          <TabsTrigger value="view-applications" className="gap-2">
            <Eye className="h-4 w-4" />
            View Applications
          </TabsTrigger>
        </TabsList>

        {/* Potential Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              Potential Clients Management
            </h2>
            <p className="text-primary-foreground/80">
              Create and manage your potential clients database. Track leads, follow-ups, and conversion opportunities.
            </p>
          </div>
          <PotentialClientsManager userId={userId} />
        </TabsContent>

        {/* Create Application Tab */}
        <TabsContent value="create-application" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              Create New Application
            </h2>
            <p className="text-primary-foreground/80">
              Start a new trade finance application for your clients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Application Creation */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Application
                </CardTitle>
                <CardDescription>
                  Create a new trade finance application quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start the application process for import/export financing, letter of credit, or trade guarantees.
                </p>
                <Button onClick={handleCreateApplication} className="w-full" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Application
                </Button>
              </CardContent>
            </Card>

            {/* Application Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Guidelines
                </CardTitle>
                <CardDescription>
                  Important information before creating an application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Required Documents</p>
                      <p className="text-xs text-muted-foreground">Ensure you have all necessary client documents ready</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Client Verification</p>
                      <p className="text-xs text-muted-foreground">Verify client identity and business registration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Financial Assessment</p>
                      <p className="text-xs text-muted-foreground">Complete financial background check</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Risk Evaluation</p>
                      <p className="text-xs text-muted-foreground">Assess trade and country risk factors</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications for Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your recently created applications for quick reference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">LC Application - ABC Trading Co.</p>
                      <p className="text-xs text-muted-foreground">Created 2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Draft</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Trade Finance - XYZ Exports</p>
                      <p className="text-xs text-muted-foreground">Created yesterday</p>
                    </div>
                  </div>
                  <Badge variant="outline">Submitted</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Import Guarantee - DEF Industries</p>
                      <p className="text-xs text-muted-foreground">Created 3 days ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Under Review</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Applications Tab */}
        <TabsContent value="view-applications" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              Applications Overview
            </h2>
            <p className="text-primary-foreground/80">
              View and manage all your submitted applications, track their status, and follow up on pending items.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* View All Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  All Applications
                </CardTitle>
                <CardDescription>
                  Browse all your submitted applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Access the complete list of applications with advanced filtering and search capabilities.
                </p>
                <Button onClick={handleViewApplications} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Applications
                </Button>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Quick Filters
                </CardTitle>
                <CardDescription>
                  Filter applications by status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleViewApplications}>
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></div>
                  Pending Applications (3)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewApplications}>
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Approved Applications (8)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewApplications}>
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                  Under Review (2)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewApplications}>
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                  Rejected Applications (1)
                </Button>
              </CardContent>
            </Card>

            {/* Application Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Application Summary</CardTitle>
                <CardDescription>Your application statistics overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Applications</span>
                    <span className="font-bold text-lg">14</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Approved</span>
                    <span className="font-medium text-green-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-600">Pending</span>
                    <span className="font-medium text-yellow-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">Under Review</span>
                    <span className="font-medium text-blue-600">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Rejected</span>
                    <span className="font-medium text-red-600">1</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="font-bold text-green-600">89%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Application Activity</CardTitle>
              <CardDescription>Latest updates on your applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Application APP-2024-001 Approved</p>
                    <p className="text-xs text-muted-foreground">ABC Trading Co. - Letter of Credit approved - 2 hours ago</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Application APP-2024-002 Under Review</p>
                    <p className="text-xs text-muted-foreground">XYZ Exports Ltd. - Trade financing moved to review - 1 day ago</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document Request for APP-2024-003</p>
                    <p className="text-xs text-muted-foreground">DEF Industries - Additional documentation required - 2 days ago</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Action Required</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
