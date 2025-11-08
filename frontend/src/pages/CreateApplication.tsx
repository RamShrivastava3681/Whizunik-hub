import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { WhizUnikLogo } from "@/components/ui/WhizUnikLogo";
import axios from "axios";

export default function CreateApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useJWTAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create applications.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Creating application with data:', formData);

      // Call the backend API to create the application
      const response = await axios.post('/applications', {
        clientName: formData.clientName,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        const application = response.data.data;
        const clientLink = `${window.location.origin}/application/${application.linkToken}`;
        
        console.log('✅ Application created successfully:', application);
        
        toast({
          title: "Application Created",
          description: `Application for ${formData.companyName} created successfully!`,
        });

        // Copy link to clipboard
        navigator.clipboard.writeText(clientLink);
        
        toast({
          title: "Link Copied",
          description: "Client application link copied to clipboard!",
        });

        navigate('/', { replace: true });
      } else {
        throw new Error(response.data.message || 'Failed to create application');
      }
    } catch (error: any) {
      console.error('❌ Error creating application:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create application.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <WhizUnikLogo size="sm" />
              <h1 className="text-2xl font-bold text-gray-900">Create New Application</h1>
            </div>
            <p className="text-gray-600">
              Generate a secure link for your client to complete their trade finance application
            </p>
          </div>
        </div>

        <Card className="p-6 bg-card/95 backdrop-blur-sm shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  className="pl-10"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  className="pl-10"
                  value={formData.clientName}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Application Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter application password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This password will be required for the client to access their application
              </p>
            </div>

            <Button
              type="submit"
              variant="financial"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Application..." : "Create Application & Generate Link"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="font-medium text-primary-foreground mb-2">What happens next?</h3>
            <ul className="text-sm text-primary-foreground/80 space-y-1">
              <li>• A unique secure link will be generated</li>
              <li>• Share this link and password with your client</li>
              <li>• Client completes the 6-step application process</li>
              <li>• You can track progress from your dashboard</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}