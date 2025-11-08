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
import { FileText, Upload, Download, X, CheckCircle, Lock, Plus, Edit, Trash2, Users, DollarSign, Building2, Shield, PenTool, UserCheck, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WhizUnikLogo } from "@/components/ui/WhizUnikLogo";
import axios from "axios";

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
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Business Information", description: "Company details and contact information" },
    { id: 2, title: "Shareholders Details", description: "Shareholder information and ownership percentages" },
    { id: 3, title: "Director's details", description: "Director names, birthdates, and DIN information" },
    { id: 4, title: "Financial Request", description: "Financing requirements and financial history" },
    { id: 5, title: "Bank Details", description: "Banking information and account details" },
    { id: 6, title: "Document Submission & Authorization", description: "Terms acceptance, signature, and document upload" }
  ];

  useEffect(() => {
    // Don't auto-fetch application, require password verification first
    setLoading(false);
  }, [token]);

  // Ensure application data is loaded properly when application changes
  useEffect(() => {
    if (application && application.applicationData) {
      setFormData(application.applicationData);
    }
  }, [application]);

  const verifyPassword = async () => {
    try {
      if (!token || !password) {
        toast({
          title: "Error",
          description: "Please enter the password",
          variant: "destructive",
        });
        return;
      }

      setVerifyingPassword(true);

      console.log('🔍 Making verify password request:', {
        url: '/applications/verify-password',
        linkToken: token,
        password: password ? '***' : undefined
      });

      const response = await axios.post('/applications/verify-password', {
        linkToken: token,
        password: password
      });
      
      console.log('✅ Verify password response:', response.data);
      
      if (response.data.success) {
        setApplication(response.data.data.application);
        setFormData(response.data.data.application.applicationData || {});
        setIsPasswordVerified(true);
        toast({
          title: "Success",
          description: "Password verified successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid password",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Error verifying password:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to verify password",
        variant: "destructive",
      });
    } finally {
      setVerifyingPassword(false);
    }
  };

  const fetchApplication = async () => {
    try {
      if (!token) {
        setError("No application token provided");
        setLoading(false);
        return;
      }

      const response = await axios.get(`/applications/token/${token}`);
      
      if (response.data.success) {
        const application = response.data.data.application;
        setApplication(application);
        
        // Ensure form data is properly set from application data
        if (application.applicationData) {
          setFormData(application.applicationData);
        } else {
          setFormData({});
        }
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

      await axios.put(`/applications/${application._id}`, {
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
        `/applications/${application._id}/documents`,
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

      await axios.put(`/applications/${application._id}`, {
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

  // Show password verification if not verified yet
  if (!isPasswordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="max-w-md w-full bg-gray-50 border border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-6 w-6 text-primary" />
              <CardTitle>Application Access</CardTitle>
            </div>
            <CardDescription>
              Please enter the password to access this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter application password"
                onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
              />
            </div>
            <Button 
              onClick={verifyPassword} 
              disabled={verifyingPassword || !password}
              className="w-full"
            >
              {verifyingPassword ? 'Verifying...' : 'Access Application'}
            </Button>
          </CardContent>
        </Card>
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

  const getCurrentStepIcon = () => {
    switch (currentStep) {
      case 1: return <Building2 className="h-6 w-6 text-blue-600" />;
      case 2: return <Users className="h-6 w-6 text-blue-600" />;
      case 3: return <UserCheck className="h-6 w-6 text-blue-600" />;
      case 4: return <DollarSign className="h-6 w-6 text-blue-600" />;
      case 5: return <Shield className="h-6 w-6 text-blue-600" />;
      case 6: return <PenTool className="h-6 w-6 text-blue-600" />;
      default: return <FileText className="h-6 w-6 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="relative mb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-repeat bg-center" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            <div className="relative p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <WhizUnikLogo size="sm" textColor="text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Trade Finance Application
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Application for <span className="font-semibold text-white">{application.companyName}</span>
                  </p>
                </div>
                <div className="text-right">
                  <ApplicationStatusBadge status={application.status as any} />
                  <p className="text-blue-100 text-sm mt-2">
                    Application ID: <span className="font-mono text-white">{application._id.slice(-8)}</span>
                  </p>
                </div>
              </div>
              
              {/* Enhanced Progress Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg">Application Progress</h3>
                  <span className="text-blue-100 font-medium">
                    Step {currentStep} of {steps.length}
                  </span>
                </div>
                
                {/* Step Progress Indicators */}
                <div className="flex items-center justify-between mb-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`
                        relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300
                        ${currentStep > step.id ? 'bg-green-500 text-white' : 
                          currentStep === step.id ? 'bg-white text-blue-600 ring-4 ring-white/30' : 
                          'bg-white/20 text-white/60 border-2 border-white/30'}
                      `}>
                        {currentStep > step.id ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          step.id
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`
                          h-1 w-16 mx-2 rounded-full transition-all duration-300
                          ${currentStep > step.id ? 'bg-green-400' : 'bg-white/30'}
                        `} />
                      )}
                    </div>
                  ))}
                </div>
                
                <Progress value={progress} className="h-3 bg-white/20" />
                <div className="flex justify-between text-sm text-blue-100 mt-2">
                  <span>{Math.round(progress)}% Complete</span>
                  <span>{steps[currentStep - 1]?.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Application Form */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  {getCurrentStepIcon()}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-gray-800">{steps[currentStep - 1]?.title}</CardTitle>
                  <CardDescription className="text-gray-600 text-base">{steps[currentStep - 1]?.description}</CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
                <TabsList className="grid w-full grid-cols-6 h-14 bg-gray-100 p-1 rounded-xl mb-8">
                  {steps.map((step) => (
                    <TabsTrigger 
                      key={step.id} 
                      value={step.id.toString()} 
                      className="flex flex-col items-center justify-center py-2 px-1 text-xs font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600"
                    >
                      <span className="font-bold text-sm">{step.id}</span>
                      <span className="hidden sm:block mt-1 text-xs truncate max-w-full">{step.shortTitle || step.title.split(' ')[0]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Step 1: Business Information */}
                <TabsContent value="1" className="space-y-6 mt-8">
                  <div className="space-y-8">
                    {/* Company Basic Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Company Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Company Name *</Label>
                          <Input
                            value={formData.businessInfo?.companyName || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'companyName', e.target.value)}
                            placeholder="Enter company name"
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Date Company was Established *</Label>
                          <Input
                            type="date"
                            value={formData.businessInfo?.establishedDate || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'establishedDate', e.target.value)}
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Type of Business *</Label>
                          <Select
                            value={formData.businessInfo?.businessType || ''}
                            onValueChange={(value) => handleInputChange('businessInfo', 'businessType', value)}
                          >
                            <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="trading">Trading</SelectItem>
                              <SelectItem value="services">Services</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="wholesale">Wholesale</SelectItem>
                              <SelectItem value="import-export">Import/Export</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="construction">Construction</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Website</Label>
                          <Input
                            value={formData.businessInfo?.website || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'website', e.target.value)}
                            placeholder="https://www.company.com"
                            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Business Address</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Street Address *</Label>
                          <Input
                            value={formData.businessInfo?.address || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'address', e.target.value)}
                            placeholder="Enter complete street address"
                            className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-200"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Country *</Label>
                            <Input
                              value={formData.businessInfo?.country || ''}
                              onChange={(e) => handleInputChange('businessInfo', 'country', e.target.value)}
                              placeholder="Country"
                              className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">State/Province *</Label>
                            <Input
                              value={formData.businessInfo?.state || ''}
                              onChange={(e) => handleInputChange('businessInfo', 'state', e.target.value)}
                              placeholder="State/Province"
                              className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">City *</Label>
                            <Input
                              value={formData.businessInfo?.city || ''}
                              onChange={(e) => handleInputChange('businessInfo', 'city', e.target.value)}
                              placeholder="City"
                              className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">ZIP/Postal Code *</Label>
                            <Input
                              value={formData.businessInfo?.zipCode || ''}
                              onChange={(e) => handleInputChange('businessInfo', 'zipCode', e.target.value)}
                              placeholder="ZIP/Postal Code"
                              className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Telephone *</Label>
                          <Input
                            value={formData.businessInfo?.telephone || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'telephone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label>Cell Phone</Label>
                          <Input
                            value={formData.businessInfo?.cellPhone || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'cellPhone', e.target.value)}
                            placeholder="+1 (555) 987-6543"
                          />
                        </div>
                        <div>
                          <Label>Contact Name *</Label>
                          <Input
                            value={formData.businessInfo?.contactName || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'contactName', e.target.value)}
                            placeholder="Primary contact person"
                          />
                        </div>
                        <div>
                          <Label>CEO Name *</Label>
                          <Input
                            value={formData.businessInfo?.ceoName || ''}
                            onChange={(e) => handleInputChange('businessInfo', 'ceoName', e.target.value)}
                            placeholder="Chief Executive Officer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Step 2: Shareholders Details */}
                <TabsContent value="2" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    {/* Shareholders List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Business Shareholders</h4>
                        <Button
                          type="button"
                          onClick={() => {
                            const newShareholder = { name: '', percentage: '', idNumber: '' };
                            const currentShareholders = formData.shareholdersInfo?.shareholders || [];
                            handleInputChange('shareholdersInfo', 'shareholders', [...currentShareholders, newShareholder]);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Shareholder
                        </Button>
                      </div>
                      
                      {formData.shareholdersInfo?.shareholders && formData.shareholdersInfo.shareholders.length > 0 ? (
                        <div className="space-y-4">
                          {formData.shareholdersInfo.shareholders.map((shareholder, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="font-medium">Shareholder {index + 1}</h5>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Edit functionality can be expanded if needed
                                      const shareholderName = prompt('Edit Shareholder Name:', shareholder.name);
                                      if (shareholderName !== null) {
                                        const updatedShareholders = [...formData.shareholdersInfo.shareholders];
                                        updatedShareholders[index] = { ...updatedShareholders[index], name: shareholderName };
                                        handleInputChange('shareholdersInfo', 'shareholders', updatedShareholders);
                                      }
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const updatedShareholders = formData.shareholdersInfo.shareholders.filter((_, i) => i !== index);
                                      handleInputChange('shareholdersInfo', 'shareholders', updatedShareholders);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Shareholder Name *</Label>
                                  <Input
                                    value={shareholder.name || ''}
                                    onChange={(e) => {
                                      const updatedShareholders = [...formData.shareholdersInfo.shareholders];
                                      updatedShareholders[index] = { ...updatedShareholders[index], name: e.target.value };
                                      handleInputChange('shareholdersInfo', 'shareholders', updatedShareholders);
                                    }}
                                    placeholder="Enter shareholder name"
                                  />
                                </div>
                                <div>
                                  <Label>Shareholding Percentage *</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={shareholder.percentage || ''}
                                    onChange={(e) => {
                                      const updatedShareholders = [...formData.shareholdersInfo.shareholders];
                                      updatedShareholders[index] = { ...updatedShareholders[index], percentage: e.target.value };
                                      handleInputChange('shareholdersInfo', 'shareholders', updatedShareholders);
                                    }}
                                    placeholder="0-100%"
                                  />
                                </div>
                                <div>
                                  <Label>ID Number *</Label>
                                  <Input
                                    value={shareholder.idNumber || ''}
                                    onChange={(e) => {
                                      const updatedShareholders = [...formData.shareholdersInfo.shareholders];
                                      updatedShareholders[index] = { ...updatedShareholders[index], idNumber: e.target.value };
                                      handleInputChange('shareholdersInfo', 'shareholders', updatedShareholders);
                                    }}
                                    placeholder="Enter ID number"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Shareholding Total Display */}
                          <div className="p-4 border rounded-lg bg-blue-50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Total Shareholding Percentage:</span>
                              <span className="font-bold text-gray-700">
                                {formData.shareholdersInfo.shareholders.reduce((sum, shareholder) => sum + (parseFloat(shareholder.percentage) || 0), 0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500 mb-4">No shareholders added yet</p>
                          <Button
                            type="button"
                            onClick={() => {
                              const newShareholder = { name: '', percentage: '', idNumber: '' };
                              handleInputChange('shareholdersInfo', 'shareholders', [newShareholder]);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Shareholder
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Step 3: Director's details */}
                <TabsContent value="3" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Director's details
                      </h3>
                      
                      {formData.principalsInfo?.principals && formData.principalsInfo.principals.length > 0 ? (
                        <div className="space-y-4">
                          {formData.principalsInfo.principals.map((principal, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Director {index + 1}</h4>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Edit mode - populate fields for editing
                                      const updatedPrincipals = [...formData.principalsInfo.principals];
                                      // In a real implementation, you might want to open an edit modal
                                      // For now, we'll just enable inline editing
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updatedPrincipals = formData.principalsInfo.principals.filter((_, i) => i !== index);
                                      handleInputChange('principalsInfo', 'principals', updatedPrincipals);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor={`principal-name-${index}`}>Name</Label>
                                  <Input
                                    id={`principal-name-${index}`}
                                    type="text"
                                    value={principal.name || ''}
                                    onChange={(e) => {
                                      const updatedPrincipals = [...formData.principalsInfo.principals];
                                      updatedPrincipals[index].name = e.target.value;
                                      handleInputChange('principalsInfo', 'principals', updatedPrincipals);
                                    }}
                                    placeholder="Enter director name"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`principal-birthdate-${index}`}>Birthdate</Label>
                                  <Input
                                    id={`principal-birthdate-${index}`}
                                    type="date"
                                    value={principal.birthDate || ''}
                                    onChange={(e) => {
                                      const updatedPrincipals = [...formData.principalsInfo.principals];
                                      updatedPrincipals[index].birthDate = e.target.value;
                                      handleInputChange('principalsInfo', 'principals', updatedPrincipals);
                                    }}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`principal-din-${index}`}>DIN</Label>
                                  <Input
                                    id={`principal-din-${index}`}
                                    type="text"
                                    value={principal.din || principal.ssn || ''}
                                    onChange={(e) => {
                                      const updatedPrincipals = [...formData.principalsInfo.principals];
                                      updatedPrincipals[index].din = e.target.value;
                                      updatedPrincipals[index].ssn = e.target.value; // Keep for backward compatibility
                                      handleInputChange('principalsInfo', 'principals', updatedPrincipals);
                                    }}
                                    placeholder="Enter DIN number"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add New Director Button */}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newPrincipal = { name: '', birthDate: '', din: '', ssn: '' };
                              const currentPrincipals = formData.principalsInfo?.principals || [];
                              handleInputChange('principalsInfo', 'principals', [...currentPrincipals, newPrincipal]);
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Director
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500 mb-4">No directors added yet</p>
                          <Button
                            type="button"
                            onClick={() => {
                              const newPrincipal = { name: '', birthDate: '', din: '', ssn: '' };
                              handleInputChange('principalsInfo', 'principals', [newPrincipal]);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Director
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Step 4: Financial Request */}
                <TabsContent value="4" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Financial Request Information
                      </h3>
                      <p className="text-gray-600 mb-6">Provide details about your financing requirements and financial history.</p>
                      
                      {/* Financial Requirements */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Financial Requirements</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="currency">Currency Type</Label>
                              <Select value={formData.financialRequestInfo?.currency || ''} onValueChange={(value) => handleInputChange('financialRequestInfo', 'currency', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {["USD", "EUR", "INR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "BRL", "MXN", "ZAR", "NZD", "SGD", "HKD", "SEK", "NOK", "KRW", "TRY", "RUB", "PLN", "DKK", "MYR", "IDR", "THB", "PHP", "CZK", "HUF", "ILS", "CLP", "PKR", "AED", "COP", "SAR", "VND", "EGP", "NGN", "BDT", "KWD", "QAR", "OMR", "LKR", "TWD", "ARS", "UAH", "KES", "GHS", "MAD", "TZS", "UGX", "DZD", "JMD", "BHD", "BBD", "BMD", "BND", "BTN", "BYN", "CRC", "CUP", "DOP", "FJD", "GEL", "GYD", "HTG", "IQD", "JOD", "KGS", "LAK", "LBP", "MKD", "MNT", "MUR", "NAD", "NPR", "PEN", "RSD", "SBD", "SCR", "SYP", "TTD", "UZS", "XCD", "ZMW"].map(currency => (
                                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="yearlySales">Yearly Sales</Label>
                              <Input
                                id="yearlySales"
                                type="number"
                                value={formData.financialRequestInfo?.yearlySales || ''}
                                onChange={(e) => handleInputChange('financialRequestInfo', 'yearlySales', e.target.value)}
                                placeholder="Enter yearly sales amount"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="grossMargin">Gross Margin (%)</Label>
                              <Input
                                id="grossMargin"
                                type="number"
                                value={formData.financialRequestInfo?.grossMargin || ''}
                                onChange={(e) => handleInputChange('financialRequestInfo', 'grossMargin', e.target.value)}
                                placeholder="Enter gross margin percentage"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="financingRequired">Financing Required</Label>
                              <Input
                                id="financingRequired"
                                type="number"
                                value={formData.financialRequestInfo?.financingRequired || ''}
                                onChange={(e) => handleInputChange('financialRequestInfo', 'financingRequired', e.target.value)}
                                placeholder="Enter financing amount needed"
                              />
                            </div>
                            
                            <div className="md:col-span-2">
                              <Label htmlFor="creditUseDestination">Destination of Credit Use</Label>
                              <Input
                                id="creditUseDestination"
                                type="text"
                                value={formData.financialRequestInfo?.creditUseDestination || ''}
                                onChange={(e) => handleInputChange('financialRequestInfo', 'creditUseDestination', e.target.value)}
                                placeholder="Describe how the credit will be used"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="numberOfClientsToFinance">Number of Clients to Finance</Label>
                              <Input
                                id="numberOfClientsToFinance"
                                type="number"
                                value={formData.financialRequestInfo?.numberOfClientsToFinance || ''}
                                onChange={(e) => handleInputChange('financialRequestInfo', 'numberOfClientsToFinance', e.target.value)}
                                placeholder="Enter number of clients"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <hr className="border-gray-200" />
                        
                        {/* Document Types */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Document Types for Financing</h4>
                          <p className="text-gray-600 text-sm mb-4">Select the types of documents you are looking to finance.</p>
                          <div className="flex flex-wrap gap-6">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="PO"
                                checked={formData.financialRequestInfo?.documentTypes?.PO || false}
                                onChange={(e) => {
                                  const currentDocTypes = formData.financialRequestInfo?.documentTypes || {};
                                  handleInputChange('financialRequestInfo', 'documentTypes', {...currentDocTypes, PO: e.target.checked});
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="PO">Purchase Orders (PO)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="Invoice"
                                checked={formData.financialRequestInfo?.documentTypes?.Invoice || false}
                                onChange={(e) => {
                                  const currentDocTypes = formData.financialRequestInfo?.documentTypes || {};
                                  handleInputChange('financialRequestInfo', 'documentTypes', {...currentDocTypes, Invoice: e.target.checked});
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="Invoice">Invoices</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="LC"
                                checked={formData.financialRequestInfo?.documentTypes?.LC || false}
                                onChange={(e) => {
                                  const currentDocTypes = formData.financialRequestInfo?.documentTypes || {};
                                  handleInputChange('financialRequestInfo', 'documentTypes', {...currentDocTypes, LC: e.target.checked});
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="LC">Letter of Credit (L/C)</Label>
                            </div>
                          </div>
                        </div>
                        
                        <hr className="border-gray-200" />
                        
                        {/* Financial History */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Financial History</h4>
                          
                          {/* Factored Receivables */}
                          <div className="mb-6">
                            <p className="font-medium mb-3">Have you ever factored your receivables?</p>
                            <div className="flex gap-6 mb-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="factoredReceivables-yes"
                                  name="factoredReceivables"
                                  value="yes"
                                  checked={formData.financialRequestInfo?.factoredReceivables === 'yes'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'factoredReceivables', e.target.value)}
                                />
                                <Label htmlFor="factoredReceivables-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="factoredReceivables-no"
                                  name="factoredReceivables"
                                  value="no"
                                  checked={formData.financialRequestInfo?.factoredReceivables === 'no'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'factoredReceivables', e.target.value)}
                                />
                                <Label htmlFor="factoredReceivables-no">No</Label>
                              </div>
                            </div>
                            {formData.financialRequestInfo?.factoredReceivables === 'yes' && (
                              <div>
                                <Label htmlFor="factoredDetails">If yes, when/with whom?</Label>
                                <Input
                                  id="factoredDetails"
                                  type="text"
                                  value={formData.financialRequestInfo?.factoredDetails || ''}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'factoredDetails', e.target.value)}
                                  placeholder="Provide details"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Credit Insurance Policy */}
                          <div className="mb-6">
                            <p className="font-medium mb-3">Do you have a Credit Insurance Policy?</p>
                            <div className="flex gap-6 mb-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="creditInsurancePolicy-yes"
                                  name="creditInsurancePolicy"
                                  value="yes"
                                  checked={formData.financialRequestInfo?.creditInsurancePolicy === 'yes'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'creditInsurancePolicy', e.target.value)}
                                />
                                <Label htmlFor="creditInsurancePolicy-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="creditInsurancePolicy-no"
                                  name="creditInsurancePolicy"
                                  value="no"
                                  checked={formData.financialRequestInfo?.creditInsurancePolicy === 'no'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'creditInsurancePolicy', e.target.value)}
                                />
                                <Label htmlFor="creditInsurancePolicy-no">No</Label>
                              </div>
                            </div>
                            {formData.financialRequestInfo?.creditInsurancePolicy === 'yes' && (
                              <div>
                                <Label htmlFor="creditInsuranceDetails">If yes, with whom?</Label>
                                <Input
                                  id="creditInsuranceDetails"
                                  type="text"
                                  value={formData.financialRequestInfo?.creditInsuranceDetails || ''}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'creditInsuranceDetails', e.target.value)}
                                  placeholder="Insurance provider details"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* UCC Filing or Liens */}
                          <div className="mb-6">
                            <p className="font-medium mb-3">Do you have any UCC Filing or liens?</p>
                            <div className="flex gap-6 mb-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="uccFilingOrLiens-yes"
                                  name="uccFilingOrLiens"
                                  value="yes"
                                  checked={formData.financialRequestInfo?.uccFilingOrLiens === 'yes'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'uccFilingOrLiens', e.target.value)}
                                />
                                <Label htmlFor="uccFilingOrLiens-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="uccFilingOrLiens-no"
                                  name="uccFilingOrLiens"
                                  value="no"
                                  checked={formData.financialRequestInfo?.uccFilingOrLiens === 'no'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'uccFilingOrLiens', e.target.value)}
                                />
                                <Label htmlFor="uccFilingOrLiens-no">No</Label>
                              </div>
                            </div>
                            {formData.financialRequestInfo?.uccFilingOrLiens === 'yes' && (
                              <div>
                                <Label htmlFor="uccFilingDetails">If yes, with whom?</Label>
                                <Input
                                  id="uccFilingDetails"
                                  type="text"
                                  value={formData.financialRequestInfo?.uccFilingDetails || ''}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'uccFilingDetails', e.target.value)}
                                  placeholder="UCC filing details"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <hr className="border-gray-200" />
                        
                        {/* Legal & Compliance */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Legal & Compliance</h4>
                          
                          {/* Declared Bankruptcy */}
                          <div className="mb-6">
                            <p className="font-medium mb-3">Has the entity or any owner/partner ever been declared bankrupt?</p>
                            <div className="flex gap-6">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="declaredBankruptcy-yes"
                                  name="declaredBankruptcy"
                                  value="yes"
                                  checked={formData.financialRequestInfo?.declaredBankruptcy === 'yes'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'declaredBankruptcy', e.target.value)}
                                />
                                <Label htmlFor="declaredBankruptcy-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="declaredBankruptcy-no"
                                  name="declaredBankruptcy"
                                  value="no"
                                  checked={formData.financialRequestInfo?.declaredBankruptcy === 'no'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'declaredBankruptcy', e.target.value)}
                                />
                                <Label htmlFor="declaredBankruptcy-no">No</Label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Past Due Taxes */}
                          <div className="mb-6">
                            <p className="font-medium mb-3">Does the applicant or any owner/partner owe any past-due taxes?</p>
                            <div className="flex gap-6">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="pastDueTaxes-yes"
                                  name="pastDueTaxes"
                                  value="yes"
                                  checked={formData.financialRequestInfo?.pastDueTaxes === 'yes'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'pastDueTaxes', e.target.value)}
                                />
                                <Label htmlFor="pastDueTaxes-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="pastDueTaxes-no"
                                  name="pastDueTaxes"
                                  value="no"
                                  checked={formData.financialRequestInfo?.pastDueTaxes === 'no'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'pastDueTaxes', e.target.value)}
                                />
                                <Label htmlFor="pastDueTaxes-no">No</Label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pending Lawsuit */}
                          <div className="mb-6">
                            <p className="font-medium mb-3">Does the applicant or any owner/partner have any pending lawsuits?</p>
                            <div className="flex gap-6">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="pendingLawsuit-yes"
                                  name="pendingLawsuit"
                                  value="yes"
                                  checked={formData.financialRequestInfo?.pendingLawsuit === 'yes'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'pendingLawsuit', e.target.value)}
                                />
                                <Label htmlFor="pendingLawsuit-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="pendingLawsuit-no"
                                  name="pendingLawsuit"
                                  value="no"
                                  checked={formData.financialRequestInfo?.pendingLawsuit === 'no'}
                                  onChange={(e) => handleInputChange('financialRequestInfo', 'pendingLawsuit', e.target.value)}
                                />
                                <Label htmlFor="pendingLawsuit-no">No</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Step 5: Bank Details */}
                <TabsContent value="5" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Bank Details
                      </h3>
                      
                      {formData.bankDetailsInfo?.bankAccounts && formData.bankDetailsInfo.bankAccounts.length > 0 ? (
                        <div className="space-y-4">
                          {formData.bankDetailsInfo.bankAccounts.map((bankAccount, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Bank Account {index + 1}</h4>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Edit mode - In a real implementation, you might want to open an edit modal
                                      // For now, inline editing is already enabled
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updatedBankAccounts = formData.bankDetailsInfo.bankAccounts.filter((_, i) => i !== index);
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`account-number-${index}`}>Account Number</Label>
                                  <Input
                                    id={`account-number-${index}`}
                                    type="text"
                                    value={bankAccount.accountNumber || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].accountNumber = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter account number"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`account-name-${index}`}>Account Name</Label>
                                  <Input
                                    id={`account-name-${index}`}
                                    type="text"
                                    value={bankAccount.accountName || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].accountName = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter account holder name"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`bank-name-${index}`}>Bank Name</Label>
                                  <Input
                                    id={`bank-name-${index}`}
                                    type="text"
                                    value={bankAccount.bankName || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].bankName = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter bank name"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`bank-address-${index}`}>Bank Address</Label>
                                  <Input
                                    id={`bank-address-${index}`}
                                    type="text"
                                    value={bankAccount.bankAddress || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].bankAddress = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter bank address"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`aba-routing-${index}`}>ABA Routing</Label>
                                  <Input
                                    id={`aba-routing-${index}`}
                                    type="text"
                                    value={bankAccount.abaRouting || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].abaRouting = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter ABA routing number"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`ifsc-code-${index}`}>IFSC Code</Label>
                                  <Input
                                    id={`ifsc-code-${index}`}
                                    type="text"
                                    value={bankAccount.ifscCode || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].ifscCode = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter IFSC code"
                                  />
                                </div>
                                
                                <div className="md:col-span-2">
                                  <Label htmlFor={`swift-code-${index}`}>SWIFT Code</Label>
                                  <Input
                                    id={`swift-code-${index}`}
                                    type="text"
                                    value={bankAccount.swiftCode || ''}
                                    onChange={(e) => {
                                      const updatedBankAccounts = [...formData.bankDetailsInfo.bankAccounts];
                                      updatedBankAccounts[index].swiftCode = e.target.value;
                                      handleInputChange('bankDetailsInfo', 'bankAccounts', updatedBankAccounts);
                                    }}
                                    placeholder="Enter SWIFT code"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add New Bank Account Button */}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newBankAccount = {
                                accountNumber: '',
                                accountName: '',
                                bankName: '',
                                bankAddress: '',
                                abaRouting: '',
                                ifscCode: '',
                                swiftCode: ''
                              };
                              const currentBankAccounts = formData.bankDetailsInfo?.bankAccounts || [];
                              handleInputChange('bankDetailsInfo', 'bankAccounts', [...currentBankAccounts, newBankAccount]);
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Bank Account
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500 mb-4">No bank accounts added yet</p>
                          <Button
                            type="button"
                            onClick={() => {
                              const newBankAccount = {
                                accountNumber: '',
                                accountName: '',
                                bankName: '',
                                bankAddress: '',
                                abaRouting: '',
                                ifscCode: '',
                                swiftCode: ''
                              };
                              handleInputChange('bankDetailsInfo', 'bankAccounts', [newBankAccount]);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Bank Account
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Step 6: Document Submission & Authorization */}
                <TabsContent value="6" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    
                    {/* Terms and Conditions */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Terms and Authorization
                      </h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          The applicant confirms that all statements in this application, along with any accompanying information, are accurate and complete. The applicant authorizes Whizunik to conduct any required credit or background checks and make such inquiries as deemed necessary to verify the information and assess the applicant's creditworthiness.
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-3 mb-6">
                        <input
                          type="checkbox"
                          id="terms-accepted"
                          checked={formData.documentSubmissionInfo?.termsAccepted || false}
                          onChange={(e) => {
                            handleInputChange('documentSubmissionInfo', 'termsAccepted', e.target.checked);
                            if (e.target.checked) {
                              handleInputChange('documentSubmissionInfo', 'termsAcceptedDate', new Date().toISOString());
                            }
                          }}
                          className="mt-1 rounded border-gray-300"
                        />
                        <Label htmlFor="terms-accepted" className="text-sm font-medium cursor-pointer">
                          I accept the terms and conditions stated above and authorize Whizunik to proceed with credit and background verification. 
                          <span className="text-red-500 ml-1">*</span>
                          <span className="block text-xs text-gray-600 mt-1 font-normal">
                            By accepting, you agree to provide your signature photo, full name, and date as required below.
                          </span>
                        </Label>
                      </div>
                    </div>

                    {/* Signature Section */}
                    {formData.documentSubmissionInfo?.termsAccepted && (
                      <div className="border rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <PenTool className="h-5 w-5" />
                          Client Signature <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          All fields below are required to complete your application.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor="signature-name">
                              Signature Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="signature-name"
                              type="text"
                              value={formData.documentSubmissionInfo?.signatureName || ''}
                              onChange={(e) => handleInputChange('documentSubmissionInfo', 'signatureName', e.target.value)}
                              placeholder="Enter full legal name for signature"
                              required
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="signature-date">
                              Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="signature-date"
                              type="date"
                              value={formData.documentSubmissionInfo?.signatureDate || new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleInputChange('documentSubmissionInfo', 'signatureDate', e.target.value)}
                              required
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Current date: {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="signature-upload">
                            Upload Signature Photo <span className="text-red-500">*</span>
                          </Label>
                          <div className="mt-2">
                            <Input
                              id="signature-upload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                // Handle signature image upload
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  handleInputChange('documentSubmissionInfo', 'signatureImagePath', file.name);
                                  // In a real implementation, you would upload this file
                                  console.log('Signature file:', file);
                                }
                              }}
                              required
                              className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="text-red-500">Required:</span> Upload a clear photo of your signature (JPG, PNG, or PDF format)
                          </p>
                          
                          {formData.documentSubmissionInfo?.signatureImagePath && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-700">
                                  Signature uploaded: {formData.documentSubmissionInfo.signatureImagePath}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Required Documents */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Required Documents for PO Financing
                      </h3>
                      
                      <p className="text-gray-600 mb-6">
                        In order to initiate a discussion with prospective lenders for Purchase Order (PO) Financing transaction, please share the following documents organized in three sections:
                      </p>
                      
                      {/* Section 1: Company Details */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                          <Building2 className="h-5 w-5" />
                          Section 1: Company Details
                        </h4>
                        <div className="space-y-4">
                          {[
                            { 
                              id: 'company-profile',
                              title: 'Company profile / Investor presentation',
                              description: 'Comprehensive company overview and presentation materials'
                            },
                            { 
                              id: 'license-copy',
                              title: 'License copy for the borrowing company and AoA / MoA',
                              description: 'Business license, Articles of Association, and Memorandum of Association'
                            },
                            { 
                              id: 'audited-financial',
                              title: 'Last three years audited financial with audit report',
                              description: 'Complete audited financial statements for the past 3 years'
                            },
                            { 
                              id: 'projections',
                              title: 'Next Year Projections',
                              description: 'Financial forecasts and business projections for the upcoming year'
                            },
                            { 
                              id: 'suppliers-list',
                              title: 'List of top 10 suppliers',
                              description: 'Details of your primary supplier relationships'
                            },
                            { 
                              id: 'sample-documents',
                              title: 'One sample set of documents',
                              description: 'Contract copy, PI, Commercial invoice, packing list, BL etc.'
                            },
                            { 
                              id: 'creditor-aging',
                              title: 'Creditor Aging',
                              description: 'Breakdown in 30 days, 60 days, 90 days, 120 days, 150 days buckets'
                            },
                            { 
                              id: 'buyers-list',
                              title: 'List of top 10 buyers',
                              description: 'Details of your primary buyer relationships and transaction history'
                            },
                            { 
                              id: 'sample-documents-2',
                              title: 'One sample set of documents',
                              description: 'Contract copy, PI, Commercial invoice, packing list, BL etc.'
                            },
                            { 
                              id: 'debtor-aging',
                              title: 'Debtor Aging',
                              description: 'Breakdown in 30 days, 60 days, 90 days, 120 days, 150 days buckets'
                            }
                          ].map((doc) => (
                            <div key={doc.id} className="border rounded-lg p-4 bg-blue-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{doc.title}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                </div>
                                <div className="ml-4">
                                  <Label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-700 rounded hover:bg-blue-100">
                                      <Upload className="h-4 w-4" />
                                      <span className="text-sm">Upload</span>
                                    </div>
                                  </Label>
                                  <Input
                                    id={`upload-${doc.id}`}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        const files = Array.from(e.target.files);
                                        console.log(`Uploading for ${doc.id}:`, files);
                                        setUploadedFiles(prev => [...prev, ...files]);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Accepted formats: PDF, Word, Excel, Images (Max 10MB each)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: KYC of Shareholders */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-800">
                          <Users className="h-5 w-5" />
                          Section 2: KYC of Shareholders
                        </h4>
                        <div className="space-y-4">
                          {[
                            { 
                              id: 'shareholder-utility-bill',
                              title: 'Latest Utility bill',
                              description: 'Recent utility bill as proof of address for all shareholders'
                            },
                            { 
                              id: 'shareholder-pan-card',
                              title: 'PAN card',
                              description: 'Permanent Account Number card for all shareholders'
                            },
                            { 
                              id: 'shareholder-passport',
                              title: 'Passport copy',
                              description: 'Valid passport copy for all shareholders'
                            },
                            { 
                              id: 'shareholder-aadhar',
                              title: 'AADHAR card',
                              description: 'Aadhaar card for identity verification of all shareholders'
                            }
                          ].map((doc) => (
                            <div key={doc.id} className="border rounded-lg p-4 bg-green-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{doc.title}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                </div>
                                <div className="ml-4">
                                  <Label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-3 py-2 border border-green-300 text-green-700 rounded hover:bg-green-100">
                                      <Upload className="h-4 w-4" />
                                      <span className="text-sm">Upload</span>
                                    </div>
                                  </Label>
                                  <Input
                                    id={`upload-${doc.id}`}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        const files = Array.from(e.target.files);
                                        console.log(`Uploading for ${doc.id}:`, files);
                                        setUploadedFiles(prev => [...prev, ...files]);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Accepted formats: PDF, Word, Images (Max 10MB each)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: KYC of Directors */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-800">
                          <UserCheck className="h-5 w-5" />
                          Section 3: KYC of Directors
                        </h4>
                        <div className="space-y-4">
                          {[
                            { 
                              id: 'director-passport',
                              title: 'Passport copy',
                              description: 'Valid passport copy for all directors'
                            },
                            { 
                              id: 'director-resume',
                              title: 'Resume/profile',
                              description: 'Professional resume or profile for all directors'
                            }
                          ].map((doc) => (
                            <div key={doc.id} className="border rounded-lg p-4 bg-purple-50">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{doc.title}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                </div>
                                <div className="ml-4">
                                  <Label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 rounded hover:bg-purple-100">
                                      <Upload className="h-4 w-4" />
                                      <span className="text-sm">Upload</span>
                                    </div>
                                  </Label>
                                  <Input
                                    id={`upload-${doc.id}`}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        const files = Array.from(e.target.files);
                                        console.log(`Uploading for ${doc.id}:`, files);
                                        setUploadedFiles(prev => [...prev, ...files]);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Accepted formats: PDF, Word, Images (Max 10MB each)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Lender Feedback Notice */}
                      {/* Lender Feedback Notice */}
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 rounded-full p-1">
                            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-6 8a1 1 0 100-2v-3a1 1 0 00-1-1H5a1 1 0 100 2v3a1 1 0 001 1h1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Processing Timeline</h4>
                            <p className="text-sm text-blue-800">
                              Once the above documents are received by the lender, they will take about a week's time in appraising the opportunity and giving their initial feedback.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Preview */}
                    {uploadedFiles.length > 0 && (
                      <div className="border rounded-lg p-6">
                        <h4 className="font-medium mb-4">Files Ready for Upload:</h4>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <div>
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
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
                            className="w-full mt-4"
                          >
                            {uploading ? 'Uploading...' : 'Upload All Files'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Uploaded Documents */}
                    {application.documents && application.documents.length > 0 && (
                      <div className="border rounded-lg p-6">
                        <h4 className="font-medium mb-4">Successfully Uploaded Documents:</h4>
                        <div className="space-y-2">
                          {application.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded bg-green-50">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">{doc.originalName}</span>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
