import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertTriangle,
  TrendingUp,
  Shield,
  Users,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
// Import auth service to ensure axios interceptors are configured
import '@/lib/auth';

interface Application {
  _id: string;
  clientName: string;
  companyName: string;
  status: string;
  linkToken: string;
  createdAt: string;
  evaluation?: Evaluation | null;
  hasEvaluation: boolean;
}

interface Evaluation {
  _id: string;
  evaluatorId: string;
  applicationId: string | { _id: string };
  creditScoring: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    score?: number;
  };
  kyc: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
  };
  aml: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
  };
  riskAssessment: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  overallStatus: 'pending' | 'approved' | 'rejected';
  completedSteps: number;
  createdAt: string;
  updatedAt: string;
}

interface EvaluatorDashboardProps {
  className?: string;
}

export function EvaluatorDashboard({ className }: EvaluatorDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      console.log('🔍 Applications data:', applications);
      applications.forEach((app, index) => {
        console.log(`🔍 Application ${index}:`, {
          _id: app._id,
          typeOf_id: typeof app._id,
          hasEvaluation: app.hasEvaluation,
          evaluation: app.evaluation
        });
      });
    }
  }, [applications]);

  useEffect(() => {
    if (evaluations.length > 0) {
      console.log('🔍 Evaluations data:', evaluations);
      evaluations.forEach((evaluation, index) => {
        console.log(`🔍 Evaluation ${index}:`, {
          applicationId: evaluation.applicationId,
          typeOfApplicationId: typeof evaluation.applicationId,
          _id: evaluation._id
        });
      });
    }
  }, [evaluations]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 EvaluatorDashboard: Starting fetchData...');
      
      // Fetch pending applications
      console.log('🔍 EvaluatorDashboard: Fetching pending applications...');
      const appsResponse = await axios.get('/evaluations/pending-applications');
      console.log('✅ EvaluatorDashboard: Pending applications response:', appsResponse.data);
      setApplications(appsResponse.data.data || []);

      // Fetch evaluations
      console.log('🔍 EvaluatorDashboard: Fetching evaluations...');
      const evalsResponse = await axios.get('/evaluations');
      console.log('✅ EvaluatorDashboard: Evaluations response:', evalsResponse.data);
      setEvaluations(evalsResponse.data.data || []);

    } catch (error) {
      console.error('❌ EvaluatorDashboard: Error fetching data:', error);
      console.error('❌ EvaluatorDashboard: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      toast({
        title: "Error",
        description: "Failed to fetch evaluation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openEvaluationPage = (applicationId: string, linkToken: string) => {
    console.log('🔍 Opening evaluation with applicationId:', applicationId);
    console.log('🔍 ApplicationId type:', typeof applicationId);
    console.log('🔍 ApplicationId value:', applicationId);
    
    if (!applicationId || typeof applicationId !== 'string') {
      console.error('❌ Invalid applicationId:', applicationId);
      return;
    }
    
    console.log('🚀 Opening evaluation page with ID:', applicationId);
    window.open(`/evaluation/${applicationId}`, '_blank');
  };

  // Filter applications
  const pendingApplications = applications.filter(app => !app.hasEvaluation || (app.evaluation && app.evaluation.overallStatus === 'pending'));
  const completedEvaluations = evaluations.filter(evaluation => evaluation.overallStatus !== 'pending');
  const inProgressEvaluations = evaluations.filter(evaluation => evaluation.overallStatus === 'pending' && evaluation.completedSteps > 0);

  // Stats calculation
  const stats = {
    total: applications.length,
    pending: pendingApplications.length,
    inProgress: inProgressEvaluations.length,
    completed: completedEvaluations.length,
    approved: completedEvaluations.filter(evaluation => evaluation.overallStatus === 'approved').length,
    rejected: completedEvaluations.filter(evaluation => evaluation.overallStatus === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="inprogress">
            In Progress ({stats.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
        </TabsList>

        {/* Pending Applications */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications Pending Evaluation</CardTitle>
              <CardDescription>
                Applications submitted by sales team that need evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No applications pending evaluation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApplications.map((app) => (
                    <div
                      key={app._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{app.clientName}</h3>
                          <Badge variant="secondary">{app.companyName}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Status: {app.status}</span>
                          <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                          {app.evaluation && (
                            <span>Steps: {Math.min(app.evaluation.completedSteps, 3)}/3</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {app.evaluation && app.evaluation.completedSteps > 0 && (
                          <Badge variant="outline">
                            {Math.min(app.evaluation.completedSteps, 3)}/3 Steps
                          </Badge>
                        )}
                        <Button
                          onClick={() => openEvaluationPage(app._id, app.linkToken)}
                          size="sm"
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {app.hasEvaluation ? 'Continue Evaluation' : 'Start Evaluation'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* In Progress Evaluations */}
        <TabsContent value="inprogress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluations In Progress</CardTitle>
              <CardDescription>
                Evaluations that have been started but not completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressEvaluations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No evaluations in progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressEvaluations.map((evaluation) => (
                    <div
                      key={evaluation._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">
                            {evaluation.applicationId && typeof evaluation.applicationId === 'object' 
                              ? (evaluation.applicationId as any).clientName 
                              : 'Unknown Client'}
                          </h3>
                          <Badge className={getStatusColor(evaluation.overallStatus)}>
                            {evaluation.overallStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(evaluation.creditScoring?.status || 'pending')}
                            <span className="text-xs">Credit</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {/* Show combined KYC/AML status - approved only if both are approved */}
                            {(evaluation.kyc?.status === 'approved' && evaluation.aml?.status === 'approved') ? 
                              getStatusIcon('approved') :
                              (evaluation.kyc?.status === 'rejected' || evaluation.aml?.status === 'rejected') ?
                              getStatusIcon('rejected') :
                              getStatusIcon('pending')
                            }
                            <span className="text-xs">KYC/AML</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(evaluation.riskAssessment?.status || 'pending')}
                            <span className="text-xs">Risk</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Progress: {Math.min(evaluation.completedSteps, 3)}/3 steps completed
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {Math.min(evaluation.completedSteps, 3)}/3 Steps
                        </Badge>
                        <Button
                          onClick={() => openEvaluationPage(
                            typeof evaluation.applicationId === 'string' 
                              ? evaluation.applicationId 
                              : evaluation.applicationId._id, 
                            ''
                          )}
                          size="sm"
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Continue
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Evaluations */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Evaluations</CardTitle>
              <CardDescription>
                All evaluations that have been completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedEvaluations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed evaluations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedEvaluations.map((evaluation) => (
                    <div
                      key={evaluation._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">
                            {evaluation.applicationId && typeof evaluation.applicationId === 'object' 
                              ? (evaluation.applicationId as any).clientName 
                              : 'Unknown Client'}
                          </h3>
                          <Badge className={getStatusColor(evaluation.overallStatus)}>
                            {evaluation.overallStatus}
                          </Badge>
                          {evaluation.riskAssessment?.riskLevel && (
                            <Badge className={getRiskColor(evaluation.riskAssessment.riskLevel)}>
                              {evaluation.riskAssessment.riskLevel} risk
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(evaluation.creditScoring?.status || 'pending')}
                            <span className="text-xs">Credit</span>
                            {evaluation.creditScoring?.score && (
                              <span className="text-xs">({evaluation.creditScoring.score})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(evaluation.kyc?.status || 'pending')}
                            <span className="text-xs">KYC</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(evaluation.aml?.status || 'pending')}
                            <span className="text-xs">AML</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(evaluation.riskAssessment?.status || 'pending')}
                            <span className="text-xs">Risk</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed: {evaluation.updatedAt ? new Date(evaluation.updatedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => openEvaluationPage(
                            typeof evaluation.applicationId === 'string' 
                              ? evaluation.applicationId 
                              : evaluation.applicationId._id, 
                            ''
                          )}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
