import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApplicationStatusBadge } from "@/components/ui/application-status-badge";
import { FileText, Calendar, User, Building2, Phone, Mail, MapPin, DollarSign } from "lucide-react";

interface MockApplication {
  id: string;
  salesman_id: string;
  client_name: string;
  company_name: string;
  status: string;
  created_at: string;
  link_token: string;
}

const ApplicationView = () => {
  const { token } = useParams<{ token: string }>();
  const [application, setApplication] = useState<MockApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!token) {
        setError("No application token provided");
        setLoading(false);
        return;
      }

      try {
        // Mock application data for JWT authentication
        const mockApplication: MockApplication = {
          id: "mock-app-" + token,
          salesman_id: "salesman-1",
          client_name: "John Smith",
          company_name: "Smith Trading Co.",
          status: "pending",
          created_at: new Date().toISOString(),
          link_token: token
        };

        console.log('Mock application loaded:', mockApplication);
        setApplication(mockApplication);
      } catch (err) {
        console.error('Error loading application:', err);
        setError("Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error || "Application not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary rounded-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground">
                  Trade Finance Application
                </h1>
                <p className="text-primary-foreground/80">
                  Application for {application.company_name}
                </p>
              </div>
            </div>
            <ApplicationStatusBadge status={application.status as any} />
          </div>

          {/* Application Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </label>
                      <p className="font-medium">{application.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Contact Person
                      </label>
                      <p className="font-medium">{application.client_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* JWT Authentication Notice */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Form</CardTitle>
                  <CardDescription>
                    This is a mock application view using JWT authentication
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      This application is now using JWT authentication instead of Supabase.
                      The form functionality would be implemented here for collecting
                      trade finance application details.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Application Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="mt-1">
                      <ApplicationStatusBadge status={application.status as any} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created Date
                    </label>
                    <p className="font-medium">
                      {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Application ID
                    </label>
                    <p className="font-mono text-sm">{application.id}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full">
                    Submit Application
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save as Draft
                  </Button>
                  <Button variant="outline" className="w-full">
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationView;
