import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationStatusBadge } from "@/components/ui/application-status-badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Download, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import { API_CONFIG } from "../config/api";
const API_BASE_URL = API_CONFIG.BASE_URL;

interface Application {
  _id: string;
  salesmanId: string;
  clientName: string;
  companyName: string;
  linkToken: string;
  status: string;
  applicationData?: any;
  documents?: DocumentFile[];
  createdAt: string;
}

interface DocumentFile {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  documentType: string;
  filePath: string;
}

const ApplicationView = () => {
  const { token } = useParams<{ token: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Company Information", description: "Basic company details" },
    { id: 2, title: "Financial Information", description: "Financial details and history" },
    { id: 3, title: "Trade Finance Requirements", description: "Specify your requirements" },
    { id: 4, title: "Contact Information", description: "Primary and financial contacts" },
    { id: 5, title: "Additional Information", description: "Additional business details" },
    { id: 6, title: "Document Upload", description: "Upload required documents" }
  ];

  useEffect(() => {
    fetchApplication();
  }, [token]);

  const fetchApplication = async () => {
    try {
      if (!token) {
        setError("No application token provided");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/applications/token/${token}`);
      
      if (response.data.success) {
        setApplication(response.data.data.application);
        setFormData(response.data.data.application.applicationData || {});
      } else {
        setError("Application not found");
      }
    } catch (err: any) {
      console.error('Error loading application:', err);
      setError(err.response?.data?.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveProgress = async () => {
    try {
      if (!application) return;

      await axios.put(`${API_BASE_URL}/applications/${application._id}`, {
        applicationData: formData,
        status: 'in-progress'
      });

      toast({
        title: "Progress Saved",
        description: "Your application data has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      if (!application) return;

      setUploading(true);
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('documents', file);
      });

      const response = await axios.post(
        `${API_BASE_URL}/applications/${application._id}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Documents Uploaded",
          description: `${files.length} document(s) uploaded successfully.`,
        });
        
        // Refresh application data
        fetchApplication();
        setUploadedFiles([]);
      }
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload Error",
        description: error.response?.data?.message || "Failed to upload documents.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const submitApplication = async () => {
    try {
      if (!application) return;

      await axios.put(`${API_BASE_URL}/applications/${application._id}`, {
        applicationData: formData,
        status: 'submitted'
      });

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully and is now under review.",
      });

      // Refresh application data
      fetchApplication();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const progress = (currentStep / steps.length) * 100;

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
                  Application for {application.companyName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ApplicationStatusBadge status={application.status as any} />
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
              <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
                <TabsList className="grid w-full grid-cols-6">
                  {steps.map((step) => (
                    <TabsTrigger key={step.id} value={step.id.toString()} className="text-xs">
                      {step.id}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Step 1: Company Information */}
                <TabsContent value="1" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company Registration Number</Label>
                      <Input
                        value={formData.companyInfo?.registrationNumber || ''}
                        onChange={(e) => handleInputChange('companyInfo', 'registrationNumber', e.target.value)}
                        placeholder="REG123456"
                      />
                    </div>
                    <div>
                      <Label>Incorporation Date</Label>
                      <Input
                        type="date"
                        value={formData.companyInfo?.incorporationDate || ''}
                        onChange={(e) => handleInputChange('companyInfo', 'incorporationDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Business Type</Label>
                      <Select
                        value={formData.companyInfo?.businessType || ''}
                        onValueChange={(value) => handleInputChange('companyInfo', 'businessType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <Input
                        value={formData.companyInfo?.industry || ''}
                        onChange={(e) => handleInputChange('companyInfo', 'industry', e.target.value)}
                        placeholder="Manufacturing, Trading, etc."
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Step 6: Document Upload */}
                <TabsContent value="6" className="space-y-4 mt-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload Documents
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
                            PDF, Word, Excel, or Image files up to 10MB each
                          </span>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files);
                              setUploadedFiles(prev => [...prev, ...files]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* File Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Files to Upload:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => handleFileUpload(uploadedFiles)}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? 'Uploading...' : 'Upload Files'}
                      </Button>
                    </div>
                  )}

                  {/* Uploaded Documents */}
                  {application.documents && application.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Uploaded Documents:</h4>
                      {application.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{doc.originalName}</span>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveProgress}>
                    Save Progress
                  </Button>
                  
                  {currentStep < steps.length ? (
                    <Button onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={submitApplication} disabled={application.status === 'submitted'}>
                      {application.status === 'submitted' ? 'Submitted' : 'Submit Application'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationView;
