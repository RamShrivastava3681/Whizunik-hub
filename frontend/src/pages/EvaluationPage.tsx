import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Building2, AlertCircle, Loader2, CheckCircle, XCircle, Clock, Eye, EyeOff, Save, Calculator, Shield, Users, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ComprehensiveApplicationDisplay } from "@/components/ComprehensiveApplicationDisplay";
import { WhizUnikLogo } from "@/components/ui/WhizUnikLogo";
import axios from "axios";

interface Application {
  _id: string;
  clientName: string;
  companyName: string;
  status: string;
  linkToken: string;
  applicationData: any;
  documents: any[];
  createdAt: string;
}

interface Evaluation {
  _id: string;
  evaluatorId: string;
  applicationId: string;
  creditScoring: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    score: number;
    mtfzScore: number; // MTF-Z calculated score
    riskCategory: 'Low Risk (Investment Grade)' | 'Watch / Medium Risk' | 'High Risk (Requires Collateral)';
    factors: {
      // X1: Working Capital / Total Assets
      workingCapital: number;
      totalAssets: number;
      x1_ratio: number;
      
      // X2: Retained Earnings / Total Assets
      retainedEarnings: number;
      x2_ratio: number;
      
      // X3: EBIT / Total Assets (Most Important Factor)
      ebit: number;
      x3_ratio: number;
      
      // X4: Equity / Total Liabilities
      equity: number;
      totalLiabilities: number;
      x4_ratio: number;
      
      // X5: Sales / Total Assets
      sales: number;
      x5_ratio: number;
      
      // X6: On-Time Payment Rate (0-1 scale)
      onTimePaymentRate: number;
      
      // X7: Top-Client Concentration (0-1 scale)
      topClientConcentration: number;
      
      // X8: Payment Dilution Index (0-1 scale)
      paymentDilutionIndex: number;
    };
  };
  kyc: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    documents: {
      identityVerified: boolean;
      addressVerified: boolean;
      businessRegistration: boolean;
      financialStatements: boolean;
    };
  };
  aml: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    checks: {
      sanctionsList: boolean;
      pepCheck: boolean;
      adverseMedia: boolean;
      sourceOfFunds: boolean;
    };
  };
  riskAssessment: {
    status: 'pending' | 'approved' | 'rejected';
    notes: string;
    riskLevel: 'low' | 'medium' | 'high';
    factors: {
      country: 'low' | 'medium' | 'high';
      industry: 'low' | 'medium' | 'high';
      transactionAmount: 'low' | 'medium' | 'high';
      clientProfile: 'low' | 'medium' | 'high';
    };
    checklist: {
      counterpartyRisk: {
        borrowerCredit: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        supplierVerification: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        managementQuality: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        relationshipHistory: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
      };
      transactionStructure: {
        collateralEvaluation: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        tradeDocumentation: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        paymentTerms: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        transactionPurpose: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
      };
      marketCommodityRisk: {
        commodityPrice: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        marketDemand: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        currencyRisk: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
        supplyChainStability: {
          status: 'complete' | 'na' | 'followup' | 'pending';
          notes: string;
        };
      };
    };
  };
  completedSteps: number;
  overallStatus: 'pending' | 'approved' | 'rejected';
  finalNotes: string;
  evaluationDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function EvaluationPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log('🔥 EvaluationPage: SIMPLE VERSION - Application ID:', applicationId);
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false); // Start with false, not true
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("credit");
  const [generatingMemo, setGeneratingMemo] = useState(false);

  useEffect(() => {
    if (applicationId) {
      // Fetch real application data from the API
      const fetchApplication = async () => {
        try {
          setLoading(true);
          console.log('🔍 Fetching application data for ID:', applicationId);
          
          const response = await axios.get(`/applications/${applicationId}`);
          const appData = response.data;
          
          console.log('📋 Fetched application data:', appData);
          setApplication(appData);
          console.log('✅ Real application data set successfully');
        } catch (error) {
          console.error('❌ Error fetching application:', error);
          
          // Fallback to basic app structure if fetch fails
          const basicApp: Application = {
            _id: applicationId,
            clientName: 'Unknown Client',
            companyName: 'Unknown Company',
            status: 'submitted',
            linkToken: 'link-token',
            applicationData: {
              requestedAmount: 0,
              businessType: 'Unknown',
              purpose: 'Unknown'
            },
            documents: [],
            createdAt: new Date().toISOString()
          };
          
          setApplication(basicApp);
          console.log('⚠️ Using fallback application data due to fetch error');
        } finally {
          setLoading(false);
        }
      };
      
      fetchApplication();
      
      // Create a basic evaluation object so the page can work
      const basicEvaluation: Evaluation = {
        _id: 'new-evaluation',
        evaluatorId: 'current-user',
        applicationId: applicationId,
        creditScoring: {
          status: 'pending',
          notes: '',
          score: 0,
          mtfzScore: 0,
          riskCategory: 'High Risk (Requires Collateral)',
          factors: {
            // X1: Working Capital / Total Assets
            workingCapital: 0,
            totalAssets: 0,
            x1_ratio: 0,
            
            // X2: Retained Earnings / Total Assets
            retainedEarnings: 0,
            x2_ratio: 0,
            
            // X3: EBIT / Total Assets
            ebit: 0,
            x3_ratio: 0,
            
            // X4: Equity / Total Liabilities
            equity: 0,
            totalLiabilities: 0,
            x4_ratio: 0,
            
            // X5: Sales / Total Assets
            sales: 0,
            x5_ratio: 0,
            
            // X6: On-Time Payment Rate (0-1 scale)
            onTimePaymentRate: 0,
            
            // X7: Top-Client Concentration (0-1 scale)
            topClientConcentration: 0,
            
            // X8: Payment Dilution Index (0-1 scale)
            paymentDilutionIndex: 0
          }
        },
        kyc: {
          status: 'pending',
          notes: '',
          documents: {
            identityVerified: false,
            addressVerified: false,
            businessRegistration: false,
            financialStatements: false
          }
        },
        aml: {
          status: 'pending',
          notes: '',
          checks: {
            sanctionsList: false,
            pepCheck: false,
            adverseMedia: false,
            sourceOfFunds: false
          }
        },
        riskAssessment: {
          status: 'pending',
          notes: '',
          riskLevel: 'low',
          factors: {
            country: 'low',
            industry: 'low',
            transactionAmount: 'low',
            clientProfile: 'low'
          },
          checklist: {
            counterpartyRisk: {
              borrowerCredit: { status: 'pending', notes: '' },
              supplierVerification: { status: 'pending', notes: '' },
              managementQuality: { status: 'pending', notes: '' },
              relationshipHistory: { status: 'pending', notes: '' }
            },
            transactionStructure: {
              collateralEvaluation: { status: 'pending', notes: '' },
              tradeDocumentation: { status: 'pending', notes: '' },
              paymentTerms: { status: 'pending', notes: '' },
              transactionPurpose: { status: 'pending', notes: '' }
            },
            marketCommodityRisk: {
              commodityPrice: { status: 'pending', notes: '' },
              marketDemand: { status: 'pending', notes: '' },
              currencyRisk: { status: 'pending', notes: '' },
              supplyChainStability: { status: 'pending', notes: '' }
            }
          }
        },
        overallStatus: 'pending',
        completedSteps: 0,
        finalNotes: '',
        evaluationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setEvaluation(basicEvaluation);
    }
  }, [applicationId]);

  // Evaluation starts as null - user can create a new one

  const handleDocumentView = async (documentId: string) => {
    try {
      setLoadingDoc(documentId);
      const response = await axios.get(`/api/documents/view/${documentId}`, {
        responseType: 'blob',
      });
      
      const fileBlob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      const url = window.URL.createObjectURL(fileBlob);
      
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to view documents.",
          variant: "destructive",
        });
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 3000);
      
    } catch (error: any) {
      console.error('Document view failed:', error);
      
      let errorMessage = "Could not open the document. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Document not found on server.";
      } else if (error.response?.status === 401) {
        errorMessage = "You are not authorized to view this document.";
      }
      
      toast({
        title: "View Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleDocumentDownload = async (documentId: string, fileName: string) => {
    try {
      setLoadingDoc(documentId);
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link?.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Downloaded ${fileName}`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    } finally {
      setLoadingDoc(null);
    }
  };

  const saveEvaluation = async (step: string, stepData: any) => {
    try {
      setSaving(true);
      console.log('Saving evaluation step:', step, stepData);
      
      if (!evaluation) {
        console.error('⚠️ No evaluation data to save - initializing with defaults');
        // Initialize evaluation with default structure if not exists
        const defaultEvaluation: Evaluation = {
          _id: '',
          evaluatorId: '',
          applicationId: applicationId || '',
          creditScoring: {
            status: 'pending',
            notes: '',
            score: 0,
            mtfzScore: 0,
            riskCategory: 'Watch / Medium Risk',
            factors: {
              workingCapital: 0,
              totalAssets: 1,
              x1_ratio: 0,
              retainedEarnings: 0,
              x2_ratio: 0,
              ebit: 0,
              x3_ratio: 0,
              equity: 0,
              totalLiabilities: 1,
              x4_ratio: 0,
              sales: 0,
              x5_ratio: 0,
              onTimePaymentRate: 0.5,
              topClientConcentration: 0.3,
              paymentDilutionIndex: 0.2
            }
          },
          kyc: { status: 'pending', notes: '', documents: { identityVerified: false, addressVerified: false, businessRegistration: false, financialStatements: false } },
          aml: { status: 'pending', notes: '', checks: { sanctionsList: false, pepCheck: false, adverseMedia: false, sourceOfFunds: false } },
          riskAssessment: { 
            status: 'pending', 
            notes: '', 
            riskLevel: 'medium', 
            factors: { country: 'medium', industry: 'medium', transactionAmount: 'medium', clientProfile: 'medium' },
            checklist: {
              counterpartyRisk: {
                borrowerCredit: { status: 'pending', notes: '' },
                supplierVerification: { status: 'pending', notes: '' },
                managementQuality: { status: 'pending', notes: '' },
                relationshipHistory: { status: 'pending', notes: '' }
              },
              transactionStructure: {
                collateralEvaluation: { status: 'pending', notes: '' },
                tradeDocumentation: { status: 'pending', notes: '' },
                paymentTerms: { status: 'pending', notes: '' },
                transactionPurpose: { status: 'pending', notes: '' }
              },
              marketCommodityRisk: {
                commodityPrice: { status: 'pending', notes: '' },
                marketDemand: { status: 'pending', notes: '' },
                currencyRisk: { status: 'pending', notes: '' },
                supplyChainStability: { status: 'pending', notes: '' }
              }
            }
          },
          completedSteps: 0,
          overallStatus: 'pending',
          finalNotes: '',
          evaluationDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setEvaluation(defaultEvaluation);
        return;
      }

      // Update the evaluation state with the current step data
      const updatedEvaluation = {
        ...evaluation,
        [step]: stepData
      };

      // Calculate overall decision based on individual step statuses
      const determineOverallDecision = (evalData: any) => {
        const { creditScoring, kyc, aml, riskAssessment } = evalData;
        
        // If any step is rejected, overall is rejected
        if (creditScoring?.status === 'rejected' || 
            kyc?.status === 'rejected' || 
            aml?.status === 'rejected' || 
            riskAssessment?.status === 'rejected') {
          return 'rejected';
        }
        
        // If all steps are approved, overall is approved
        if (creditScoring?.status === 'approved' && 
            kyc?.status === 'approved' && 
            aml?.status === 'approved' && 
            riskAssessment?.status === 'approved') {
          return 'approved';
        }
        
        // Otherwise, needs more info (default for step-by-step saving)
        return 'needs_more_info';
      };

      // Prepare the complete evaluation data for backend
      const decision = determineOverallDecision(updatedEvaluation);
      console.log('🔍 Frontend: Calculated decision:', decision);
      console.log('🔍 Frontend: Updated evaluation:', updatedEvaluation);
      
      const evaluationData = {
        applicationId,
        decision: decision,
        score: updatedEvaluation.creditScoring?.mtfzScore || 0,
        comments: updatedEvaluation.finalNotes || 'Step-by-step evaluation in progress',
        riskAssessment: updatedEvaluation.riskAssessment?.riskLevel || 'medium',
        recommendedAmount: 0, // Could be calculated based on evaluation
        conditions: [] // Could include any conditions from the evaluation
      };

      console.log('🚀 Frontend: Sending evaluation data:', evaluationData);
      
      const response = await axios.post('/evaluations', evaluationData);

      if (response.data.success) {
        // Update the local evaluation state
        setEvaluation(updatedEvaluation);
        
        // Evaluation saved successfully
        toast({
          title: "Success",
          description: "Evaluation updated successfully",
        });
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: "Error",
        description: "Failed to save evaluation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateEvaluationField = (step: string, field: string, value: any) => {
    if (!evaluation) return;
    
    setEvaluation(prev => {
      if (!prev) return prev;
      
      const stepData = prev[step as keyof Evaluation] as any;
      
      return {
        ...prev,
        [step]: {
          ...stepData,
          [field]: value
        }
      };
    });
  };

  // Calculate completed steps based on evaluation status
  const calculateCompletedSteps = (evalData: Evaluation) => {
    let completedCount = 0;
    
    // Step 1: Credit Scoring - considered complete if status is approved or rejected (not pending)
    if (evalData.creditScoring?.status !== 'pending') {
      completedCount++;
    }
    
    // Step 2: KYC & AML - considered complete if both have non-pending status
    if (evalData.kyc?.status !== 'pending' && evalData.aml?.status !== 'pending') {
      completedCount++;
    }
    
    // Step 3: Risk Assessment - considered complete if status is not pending
    if (evalData.riskAssessment?.status !== 'pending') {
      completedCount++;
    }
    
    return completedCount;
  };

  // Update completed steps whenever evaluation changes
  React.useEffect(() => {
    if (evaluation) {
      const newCompletedSteps = calculateCompletedSteps(evaluation);
      if (newCompletedSteps !== evaluation.completedSteps) {
        setEvaluation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            completedSteps: newCompletedSteps
          };
        });
      }
    }
  }, [evaluation?.creditScoring?.status, evaluation?.kyc?.status, evaluation?.aml?.status, evaluation?.riskAssessment?.status]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getChecklistStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'na': return <Badge variant="outline" className="text-xs">N/A</Badge>;
      case 'followup': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChecklistStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Complete</Badge>;
      case 'na': return <Badge variant="outline" className="text-xs">N/A</Badge>;
      case 'followup': return <Badge variant="destructive" className="text-xs">Follow-up</Badge>;
      default: return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
  };

  const updateChecklistItem = (category: string, item: string, field: string, value: any) => {
    if (!evaluation) return;
    
    setEvaluation(prev => {
      if (!prev) return prev;
      
      const updatedChecklist = { ...prev.riskAssessment.checklist };
      const categoryData = updatedChecklist[category as keyof typeof updatedChecklist] as any;
      
      return {
        ...prev,
        riskAssessment: {
          ...prev.riskAssessment,
          checklist: {
            ...updatedChecklist,
            [category]: {
              ...categoryData,
              [item]: {
                ...categoryData[item],
                [field]: value
              }
            }
          }
        }
      };
    });
  };

  // MTF-Z Score Calculation Function
  const calculateMTFZScore = (factors: any) => {
    // Calculate individual ratios
    const x1 = factors.totalAssets > 0 ? factors.workingCapital / factors.totalAssets : 0;
    const x2 = factors.totalAssets > 0 ? factors.retainedEarnings / factors.totalAssets : 0;
    const x3 = factors.totalAssets > 0 ? factors.ebit / factors.totalAssets : 0;
    const x4 = factors.totalLiabilities > 0 ? factors.equity / factors.totalLiabilities : 0;
    const x5 = factors.totalAssets > 0 ? factors.sales / factors.totalAssets : 0;
    const x6 = factors.onTimePaymentRate; // Already 0-1 scale
    const x7 = factors.topClientConcentration; // Already 0-1 scale
    const x8 = factors.paymentDilutionIndex; // Already 0-1 scale

    // Calculate MTF-Z Score using proprietary algorithm
    const mtfzScore = (0.65 * x1) + (0.80 * x2) + (3.10 * x3) + (0.40 * x4) + (0.95 * x5) + (1.60 * x6) - (1.20 * x7) - (1.00 * x8);

    // Determine risk category based on score
    let riskCategory: 'Low Risk (Investment Grade)' | 'Watch / Medium Risk' | 'High Risk (Requires Collateral)';
    if (mtfzScore > 2.8) {
      riskCategory = 'Low Risk (Investment Grade)';
    } else if (mtfzScore >= 1.4) {
      riskCategory = 'Watch / Medium Risk';
    } else {
      riskCategory = 'High Risk (Requires Collateral)';
    }

    return {
      mtfzScore: Number(mtfzScore.toFixed(3)),
      riskCategory,
      ratios: {
        x1: Number(x1.toFixed(4)),
        x2: Number(x2.toFixed(4)),
        x3: Number(x3.toFixed(4)),
        x4: Number(x4.toFixed(4)),
        x5: Number(x5.toFixed(4)),
        x6: Number(x6.toFixed(4)),
        x7: Number(x7.toFixed(4)),
        x8: Number(x8.toFixed(4))
      }
    };
  };

  // Update MTF-Z score whenever factors change
  React.useEffect(() => {
    if (evaluation?.creditScoring?.factors) {
      const result = calculateMTFZScore(evaluation.creditScoring.factors);
      
      setEvaluation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          creditScoring: {
            ...prev.creditScoring,
            mtfzScore: result.mtfzScore,
            riskCategory: result.riskCategory,
            factors: {
              ...prev.creditScoring.factors,
              x1_ratio: result.ratios.x1,
              x2_ratio: result.ratios.x2,
              x3_ratio: result.ratios.x3,
              x4_ratio: result.ratios.x4,
              x5_ratio: result.ratios.x5
            }
          }
        };
      });
    }
  }, [evaluation?.creditScoring?.factors?.workingCapital, evaluation?.creditScoring?.factors?.totalAssets, 
      evaluation?.creditScoring?.factors?.retainedEarnings, evaluation?.creditScoring?.factors?.ebit,
      evaluation?.creditScoring?.factors?.equity, evaluation?.creditScoring?.factors?.totalLiabilities,
      evaluation?.creditScoring?.factors?.sales, evaluation?.creditScoring?.factors?.onTimePaymentRate,
      evaluation?.creditScoring?.factors?.topClientConcentration, evaluation?.creditScoring?.factors?.paymentDilutionIndex]);

  const generateEvaluationMemo = () => {
    if (!evaluation || !application) return '';

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const getStatusText = (status: string) => {
      switch (status) {
        case 'approved': return 'APPROVED';
        case 'rejected': return 'REJECTED';
        default: return 'PENDING REVIEW';
      }
    };

    const getRiskLevelText = (level: string) => {
      return level.toUpperCase() + ' RISK';
    };

    const getStepStatusIcon = (status: string) => {
      switch (status) {
        case 'approved': return '✓ PASSED';
        case 'rejected': return '✗ FAILED';
        default: return '○ PENDING';
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const getOverallRecommendation = () => {
      const { creditScoring, kyc, aml, riskAssessment } = evaluation;
      
      if (creditScoring?.status === 'rejected' || kyc?.status === 'rejected' || 
          aml?.status === 'rejected' || riskAssessment?.status === 'rejected') {
        return 'REJECTION RECOMMENDED - One or more critical evaluation criteria failed.';
      }
      
      if (creditScoring?.status === 'approved' && kyc?.status === 'approved' && 
          aml?.status === 'approved' && riskAssessment?.status === 'approved') {
        return 'APPROVAL RECOMMENDED - All evaluation criteria successfully met.';
      }
      
      return 'FURTHER REVIEW REQUIRED - Evaluation incomplete or requires additional information.';
    };

    const getChecklistSummary = (checklist: any) => {
      const categories = ['counterpartyRisk', 'transactionStructure', 'marketCommodityRisk'];
      let summary = '';
      
      categories.forEach(category => {
        const categoryName = category === 'counterpartyRisk' ? 'Counterparty Risk' :
                           category === 'transactionStructure' ? 'Transaction Structure' : 'Market & Commodity Risk';
        summary += `\n${categoryName}:\n`;
        
        const items = checklist[category] || {};
        Object.entries(items).forEach(([key, value]: [string, any]) => {
          const itemName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          summary += `  • ${itemName}: ${value.status?.toUpperCase() || 'PENDING'}\n`;
          if (value.notes) {
            summary += `    Notes: ${value.notes}\n`;
          }
        });
      });
      
      return summary;
    };

    return `
===============================================================
                    TRADE FINANCE EVALUATION MEMO
===============================================================

Report Generated: ${currentDate} at ${currentTime}
Application ID: ${application._id}
Applicant: ${application.clientName}
Company: ${application.companyName}
Application Status: ${application.status?.toUpperCase() || 'UNDER REVIEW'}

===============================================================
                        EXECUTIVE SUMMARY
===============================================================

Evaluation Progress: ${evaluation.completedSteps}/3 Steps Completed
Overall Status: ${getStatusText(evaluation.overallStatus)}
Final Recommendation: ${getOverallRecommendation()}

===============================================================
                    DETAILED EVALUATION RESULTS
===============================================================

STEP 1: CREDIT SCORING ANALYSIS ${getStepStatusIcon(evaluation.creditScoring?.status)}
--------------------------------------------------------------
   Status: ${getStatusText(evaluation.creditScoring?.status)}
   MTF-Z Credit Score: ${evaluation.creditScoring?.mtfzScore?.toFixed(3) || 'Not calculated'}
   Risk Category: ${evaluation.creditScoring?.riskCategory || 'Not determined'}
   
   Financial Metrics Analysis:
   • Working Capital: ${formatCurrency(evaluation.creditScoring?.factors?.workingCapital || 0)}
   • Total Assets: ${formatCurrency(evaluation.creditScoring?.factors?.totalAssets || 0)}
   • Retained Earnings: ${formatCurrency(evaluation.creditScoring?.factors?.retainedEarnings || 0)}
   • EBIT: ${formatCurrency(evaluation.creditScoring?.factors?.ebit || 0)}
   • Equity: ${formatCurrency(evaluation.creditScoring?.factors?.equity || 0)}
   • Total Liabilities: ${formatCurrency(evaluation.creditScoring?.factors?.totalLiabilities || 0)}
   • Annual Sales: ${formatCurrency(evaluation.creditScoring?.factors?.sales || 0)}
   
   Risk Factors:
   • On-Time Payment Rate: ${((evaluation.creditScoring?.factors?.onTimePaymentRate || 0) * 100).toFixed(1)}%
   • Top Client Concentration: ${((evaluation.creditScoring?.factors?.topClientConcentration || 0) * 100).toFixed(1)}%
   • Payment Dilution Index: ${((evaluation.creditScoring?.factors?.paymentDilutionIndex || 0) * 100).toFixed(1)}%
   
   Evaluator Notes: ${evaluation.creditScoring?.notes || 'No additional notes provided'}

STEP 2: KYC & AML COMPLIANCE ${getStepStatusIcon(evaluation.kyc?.status)} / ${getStepStatusIcon(evaluation.aml?.status)}
--------------------------------------------------------------
   
   KYC (Know Your Customer) Status: ${getStatusText(evaluation.kyc?.status)}
   ----------------------------------------
   Document Verification:
   • Identity Verification: ${evaluation.kyc?.documents?.identityVerified ? '✓ VERIFIED' : '✗ NOT VERIFIED'}
   • Address Verification: ${evaluation.kyc?.documents?.addressVerified ? '✓ VERIFIED' : '✗ NOT VERIFIED'}
   • Business Registration: ${evaluation.kyc?.documents?.businessRegistration ? '✓ VERIFIED' : '✗ NOT VERIFIED'}
   • Financial Statements: ${evaluation.kyc?.documents?.financialStatements ? '✓ VERIFIED' : '✗ NOT VERIFIED'}
   
   KYC Notes: ${evaluation.kyc?.notes || 'No additional notes provided'}
   
   AML (Anti-Money Laundering) Status: ${getStatusText(evaluation.aml?.status)}
   ----------------------------------------
   Compliance Checks:
   • Sanctions List Screening: ${evaluation.aml?.checks?.sanctionsList ? '✓ CLEARED' : '✗ PENDING/FAILED'}
   • PEP (Politically Exposed Person) Check: ${evaluation.aml?.checks?.pepCheck ? '✓ CLEARED' : '✗ PENDING/FAILED'}
   • Adverse Media Screening: ${evaluation.aml?.checks?.adverseMedia ? '✓ CLEARED' : '✗ PENDING/FAILED'}
   • Source of Funds Verification: ${evaluation.aml?.checks?.sourceOfFunds ? '✓ VERIFIED' : '✗ NOT VERIFIED'}
   
   AML Notes: ${evaluation.aml?.notes || 'No additional notes provided'}

STEP 3: RISK ASSESSMENT ${getStepStatusIcon(evaluation.riskAssessment?.status)}
--------------------------------------------------------------
   Status: ${getStatusText(evaluation.riskAssessment?.status)}
   Overall Risk Level: ${getRiskLevelText(evaluation.riskAssessment?.riskLevel)}
   
   Risk Factor Analysis:
   • Country Risk: ${evaluation.riskAssessment?.factors?.country?.toUpperCase() || 'NOT ASSESSED'}
   • Industry Risk: ${evaluation.riskAssessment?.factors?.industry?.toUpperCase() || 'NOT ASSESSED'}
   • Transaction Amount Risk: ${evaluation.riskAssessment?.factors?.transactionAmount?.toUpperCase() || 'NOT ASSESSED'}
   • Client Profile Risk: ${evaluation.riskAssessment?.factors?.clientProfile?.toUpperCase() || 'NOT ASSESSED'}

RISK ASSESSMENT CHECKLIST:${getChecklistSummary(evaluation.riskAssessment?.checklist || {})}
   
   Risk Assessment Notes: ${evaluation.riskAssessment?.notes || 'No additional notes provided'}

===============================================================
                      FINAL EVALUATION SUMMARY
===============================================================

Evaluation Completion Date: ${evaluation.evaluationDate ? new Date(evaluation.evaluationDate).toLocaleDateString() : currentDate}
Total Steps Completed: ${evaluation.completedSteps}/3
All Required Steps Completed: ${evaluation.completedSteps >= 3 ? 'YES' : 'NO'}

FINAL NOTES AND RECOMMENDATIONS:
${evaluation.finalNotes || 'No final evaluation notes provided.'}

EVALUATOR DECISION:
${getOverallRecommendation()}

===============================================================
                         DISCLAIMER
===============================================================

This evaluation memo is generated based on the information provided 
and analysis conducted using WhizUnik's proprietary MTF-Z scoring 
algorithm and standardized risk assessment procedures.

This report is confidential and intended solely for internal use 
by authorized WhizUnik personnel for trade finance decision-making 
purposes.

Report Generated By: WhizUnik Trade Finance Platform
Generated On: ${currentDate} ${currentTime}

Evaluation completed on: ${currentDate}
Evaluator ID: ${evaluation.evaluatorId}

---
This memo is generated automatically by the Whizunik Trade Finance Platform.
For questions or clarification, please contact the evaluation team.
    `.trim();
  };

  const downloadEvaluationMemo = async () => {
    try {
      setGeneratingMemo(true);
      
      const memoContent = generateEvaluationMemo();
      
      // Create blob with memo content
      const blob = new Blob([memoContent], { type: 'text/plain' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Evaluation_Memo_${application?._id}_${new Date().toISOString().split('T')[0]}.txt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Evaluation memo downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating memo:', error);
      toast({
        title: "Error",
        description: "Failed to generate evaluation memo",
        variant: "destructive",
      });
    } finally {
      setGeneratingMemo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  if (!evaluation || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Evaluation Not Found</h2>
          <p className="text-gray-600 mb-4">The requested evaluation could not be found.</p>
          <Button onClick={() => navigate('/evaluator')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/evaluator')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <WhizUnikLogo size="sm" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Application Evaluation</h1>
                <p className="text-gray-600">Review and evaluate trade finance application</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-2"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showDetails ? 'Hide' : 'Show'} Application Details</span>
              </Button>
              
              {/* Download Memo Buttons - Show when evaluation has progress */}
              {evaluation.completedSteps > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={downloadEvaluationMemo}
                    disabled={generatingMemo}
                    className="flex items-center space-x-2"
                  >
                    {generatingMemo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span>Download Memo</span>
                  </Button>
                </div>
              )}
              
              <Badge 
                variant={
                  evaluation.overallStatus === 'approved' ? 'default' : 
                  evaluation.overallStatus === 'rejected' ? 'destructive' : 'secondary'
                }
                className="text-sm"
              >
                {evaluation.overallStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Application Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Application Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm font-medium">Application ID</Label>
                  <p className="text-sm text-muted-foreground">{application._id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Applicant</Label>
                  <p className="text-sm text-muted-foreground">{application.clientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-muted-foreground">{application.companyName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Progress</Label>
                  <p className="text-sm text-muted-foreground">{evaluation.completedSteps}/3 Steps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Progress</CardTitle>
              <CardDescription>Complete all evaluation steps to approve or reject the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white">
                  <Calculator className="h-6 w-6 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Credit Scoring</h4>
                      {getStepIcon(evaluation.creditScoring.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">Financial analysis & scoring</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white">
                  <Users className="h-6 w-6 text-purple-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">KYC & AML</h4>
                      <div className="flex space-x-1">
                        {getStepIcon(evaluation.kyc.status)}
                        {getStepIcon(evaluation.aml.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Identity & compliance checks</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white">
                  <Shield className="h-6 w-6 text-orange-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Risk Assessment</h4>
                      {getStepIcon(evaluation.riskAssessment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">Overall risk evaluation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="credit" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Credit Scoring</span>
              </TabsTrigger>
              <TabsTrigger value="kyc" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>KYC & AML</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Risk Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="final" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Final Review</span>
              </TabsTrigger>
            </TabsList>

            {/* Credit Scoring Tab - MTF-Z Implementation */}
            <TabsContent value="credit">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5" />
                      <span>MTF-Z Credit Scoring</span>
                    </CardTitle>
                    <CardDescription>Whizunik Trade Finance Z-Score (MTF-Z) Risk Assessment</CardDescription>
                  </div>
                  {getStepBadge(evaluation.creditScoring.status)}
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* MTF-Z Score Display */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-blue-900">MTF-Z Score</h3>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {(() => {
                            const factors = evaluation.creditScoring.factors;
                            const x1 = factors.totalAssets > 0 ? factors.workingCapital / factors.totalAssets : 0;
                            const x2 = factors.totalAssets > 0 ? factors.retainedEarnings / factors.totalAssets : 0;
                            const x3 = factors.totalAssets > 0 ? factors.ebit / factors.totalAssets : 0;
                            const x4 = factors.totalLiabilities > 0 ? factors.equity / factors.totalLiabilities : 0;
                            const x5 = factors.totalAssets > 0 ? factors.sales / factors.totalAssets : 0;
                            const x6 = factors.onTimePaymentRate || 0;
                            const x7 = factors.topClientConcentration || 0;
                            const x8 = factors.paymentDilutionIndex || 0;
                            
                            const mtfzScore = (0.65 * x1) + (0.80 * x2) + (3.10 * x3) + (0.40 * x4) + (0.95 * x5) + (1.60 * x6) - (1.20 * x7) - (1.00 * x8);
                            return mtfzScore.toFixed(3);
                          })()}
                        </div>
                        <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                          (() => {
                            const factors = evaluation.creditScoring.factors;
                            const x1 = factors.totalAssets > 0 ? factors.workingCapital / factors.totalAssets : 0;
                            const x2 = factors.totalAssets > 0 ? factors.retainedEarnings / factors.totalAssets : 0;
                            const x3 = factors.totalAssets > 0 ? factors.ebit / factors.totalAssets : 0;
                            const x4 = factors.totalLiabilities > 0 ? factors.equity / factors.totalLiabilities : 0;
                            const x5 = factors.totalAssets > 0 ? factors.sales / factors.totalAssets : 0;
                            const x6 = factors.onTimePaymentRate || 0;
                            const x7 = factors.topClientConcentration || 0;
                            const x8 = factors.paymentDilutionIndex || 0;
                            
                            const mtfzScore = (0.65 * x1) + (0.80 * x2) + (3.10 * x3) + (0.40 * x4) + (0.95 * x5) + (1.60 * x6) - (1.20 * x7) - (1.00 * x8);
                            
                            if (mtfzScore > 2.8) return 'bg-green-100 text-green-800';
                            else if (mtfzScore >= 1.4) return 'bg-yellow-100 text-yellow-800';
                            else return 'bg-red-100 text-red-800';
                          })()
                        }`}>
                          {(() => {
                            const factors = evaluation.creditScoring.factors;
                            const x1 = factors.totalAssets > 0 ? factors.workingCapital / factors.totalAssets : 0;
                            const x2 = factors.totalAssets > 0 ? factors.retainedEarnings / factors.totalAssets : 0;
                            const x3 = factors.totalAssets > 0 ? factors.ebit / factors.totalAssets : 0;
                            const x4 = factors.totalLiabilities > 0 ? factors.equity / factors.totalLiabilities : 0;
                            const x5 = factors.totalAssets > 0 ? factors.sales / factors.totalAssets : 0;
                            const x6 = factors.onTimePaymentRate || 0;
                            const x7 = factors.topClientConcentration || 0;
                            const x8 = factors.paymentDilutionIndex || 0;
                            
                            const mtfzScore = (0.65 * x1) + (0.80 * x2) + (3.10 * x3) + (0.40 * x4) + (0.95 * x5) + (1.60 * x6) - (1.20 * x7) - (1.00 * x8);
                            
                            if (mtfzScore > 2.8) return 'Low Risk (Investment Grade)';
                            else if (mtfzScore >= 1.4) return 'Watch / Medium Risk';
                            else return 'High Risk (Requires Collateral)';
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p className="mt-1">
                        <strong>Risk Bands:</strong> 
                        <span className="ml-2 text-green-600">&gt;2.8 = Low Risk</span>
                        <span className="ml-2 text-yellow-600">1.4-2.8 = Medium Risk</span>
                        <span className="ml-2 text-red-600">&lt;1.4 = High Risk</span>
                      </p>
                    </div>
                  </div>

                  {/* Financial Ratios (X1-X5) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Financial Ratios (X1-X5)</h4>
                      
                      {/* X1: Working Capital / Total Assets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">X₁: Working Capital / Total Assets</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-xs">Working Capital</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.workingCapital || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                workingCapital: Number(e.target.value) || 0
                              })}
                              placeholder="Enter working capital"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Total Assets</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.totalAssets || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                totalAssets: Number(e.target.value) || 0
                              })}
                              placeholder="Enter total assets"
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Ratio: {evaluation.creditScoring.factors.totalAssets > 0 ? 
                            (evaluation.creditScoring.factors.workingCapital / evaluation.creditScoring.factors.totalAssets).toFixed(4) : 
                            '0.0000'}
                        </div>
                      </div>

                      {/* X2: Retained Earnings / Total Assets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">X₂: Retained Earnings / Total Assets</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-xs">Retained Earnings</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.retainedEarnings || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                retainedEarnings: Number(e.target.value) || 0
                              })}
                              placeholder="Enter retained earnings"
                            />
                          </div>
                          <div className="text-sm text-gray-600 pt-5">
                            Total Assets: {evaluation.creditScoring.factors.totalAssets.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Ratio: {evaluation.creditScoring.factors.totalAssets > 0 ? 
                            (evaluation.creditScoring.factors.retainedEarnings / evaluation.creditScoring.factors.totalAssets).toFixed(4) : 
                            '0.0000'}
                        </div>
                      </div>

                      {/* X3: EBIT / Total Assets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">X₃: EBIT / Total Assets (Most Important) ⭐</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-xs">EBIT (Earnings Before Interest & Tax)</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.ebit || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                ebit: Number(e.target.value) || 0
                              })}
                              placeholder="Enter EBIT"
                            />
                          </div>
                          <div className="text-sm text-gray-600 pt-5">
                            Total Assets: {evaluation.creditScoring.factors.totalAssets.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Ratio: {evaluation.creditScoring.factors.totalAssets > 0 ? 
                            (evaluation.creditScoring.factors.ebit / evaluation.creditScoring.factors.totalAssets).toFixed(4) : 
                            '0.0000'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Most heavily weighted factor</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-lg border-b pb-2">Leverage & Behavioral Metrics</h4>
                      
                      {/* X4: Equity / Total Liabilities */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">X₄: Equity / Total Liabilities</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-xs">Equity</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.equity || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                equity: Number(e.target.value) || 0
                              })}
                              placeholder="Enter equity"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Total Liabilities</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.totalLiabilities || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                totalLiabilities: Number(e.target.value) || 0
                              })}
                              placeholder="Enter total liabilities"
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Ratio: {evaluation.creditScoring.factors.totalLiabilities > 0 ? 
                            (evaluation.creditScoring.factors.equity / evaluation.creditScoring.factors.totalLiabilities).toFixed(4) : 
                            '0.0000'}
                        </div>
                      </div>

                      {/* X5: Sales / Total Assets */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">X₅: Sales / Total Assets</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-xs">Sales Revenue</Label>
                            <Input
                              type="number"
                              value={evaluation.creditScoring.factors.sales || ''}
                              onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                                ...evaluation.creditScoring.factors,
                                sales: Number(e.target.value) || 0
                              })}
                              placeholder="Enter sales revenue"
                            />
                          </div>
                          <div className="text-sm text-gray-600 pt-5">
                            Total Assets: {evaluation.creditScoring.factors.totalAssets.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Ratio: {evaluation.creditScoring.factors.totalAssets > 0 ? 
                            (evaluation.creditScoring.factors.sales / evaluation.creditScoring.factors.totalAssets).toFixed(4) : 
                            '0.0000'}
                        </div>
                      </div>

                      {/* Behavioral Metrics X6-X8 */}
                      <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                        <h5 className="font-medium mb-3 text-yellow-800">Behavioral Risk Factors</h5>
                        
                        {/* X6: On-Time Payment Rate */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm font-medium">X₆: On-Time Payment Rate</Label>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={evaluation.creditScoring.factors.onTimePaymentRate || ''}
                            onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                              ...evaluation.creditScoring.factors,
                              onTimePaymentRate: Number(e.target.value) || 0
                            })}
                            placeholder="0.85"
                          />
                          <div className="text-xs text-gray-500">Scale: 0-1 (e.g., 0.85 = 85% on-time payments)</div>
                        </div>

                        {/* X7: Top-Client Concentration */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm font-medium">X₇: Top-Client Concentration</Label>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={evaluation.creditScoring.factors.topClientConcentration || ''}
                            onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                              ...evaluation.creditScoring.factors,
                              topClientConcentration: Number(e.target.value) || 0
                            })}
                            placeholder="0.30"
                          />
                          <div className="text-xs text-gray-500">Scale: 0-1 (e.g., 0.30 = 30% revenue from top clients)</div>
                        </div>

                        {/* X8: Payment Dilution Index */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm font-medium">X₈: Payment Dilution Index</Label>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={evaluation.creditScoring.factors.paymentDilutionIndex || ''}
                            onChange={(e) => updateEvaluationField('creditScoring', 'factors', {
                              ...evaluation.creditScoring.factors,
                              paymentDilutionIndex: Number(e.target.value) || 0
                            })}
                            placeholder="0.05"
                          />
                          <div className="text-xs text-gray-500">Scale: 0-1 (e.g., 0.05 = 5% lost to deductions)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Credit Analysis Notes</Label>
                    <Textarea
                      value={evaluation.creditScoring.notes}
                      onChange={(e) => updateEvaluationField('creditScoring', 'notes', e.target.value)}
                      placeholder="Enter detailed notes about MTF-Z analysis, key findings, and risk factors..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Label>Credit Decision</Label>
                      <Select
                        value={evaluation.creditScoring.status}
                        onValueChange={(value) => updateEvaluationField('creditScoring', 'status', value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={() => saveEvaluation('creditScoring', evaluation.creditScoring)}
                      disabled={saving}
                      size="lg"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save MTF-Z Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC & AML Tab */}
            <TabsContent value="kyc">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>KYC (Know Your Customer)</CardTitle>
                      <CardDescription>Verify customer identity and documentation</CardDescription>
                    </div>
                    {getStepBadge(evaluation.kyc.status)}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.kyc.documents.identityVerified}
                          onCheckedChange={(checked) => updateEvaluationField('kyc', 'documents', {
                            ...evaluation.kyc.documents,
                            identityVerified: checked
                          })}
                        />
                        <Label>Identity Verified</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.kyc.documents.addressVerified}
                          onCheckedChange={(checked) => updateEvaluationField('kyc', 'documents', {
                            ...evaluation.kyc.documents,
                            addressVerified: checked
                          })}
                        />
                        <Label>Address Verified</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.kyc.documents.businessRegistration}
                          onCheckedChange={(checked) => updateEvaluationField('kyc', 'documents', {
                            ...evaluation.kyc.documents,
                            businessRegistration: checked
                          })}
                        />
                        <Label>Business Registration</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.kyc.documents.financialStatements}
                          onCheckedChange={(checked) => updateEvaluationField('kyc', 'documents', {
                            ...evaluation.kyc.documents,
                            financialStatements: checked
                          })}
                        />
                        <Label>Financial Statements</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>KYC Notes</Label>
                      <Textarea
                        value={evaluation.kyc.notes}
                        onChange={(e) => updateEvaluationField('kyc', 'notes', e.target.value)}
                        placeholder="Enter KYC verification notes..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Label>KYC Status</Label>
                        <Select
                          value={evaluation.kyc.status}
                          onValueChange={(value) => updateEvaluationField('kyc', 'status', value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={() => saveEvaluation('kyc', evaluation.kyc)}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save KYC
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>AML (Anti-Money Laundering)</CardTitle>
                      <CardDescription>Compliance and regulatory checks</CardDescription>
                    </div>
                    {getStepBadge(evaluation.aml.status)}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.aml.checks.sanctionsList}
                          onCheckedChange={(checked) => updateEvaluationField('aml', 'checks', {
                            ...evaluation.aml.checks,
                            sanctionsList: checked
                          })}
                        />
                        <Label>Sanctions List Check</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.aml.checks.pepCheck}
                          onCheckedChange={(checked) => updateEvaluationField('aml', 'checks', {
                            ...evaluation.aml.checks,
                            pepCheck: checked
                          })}
                        />
                        <Label>PEP Check</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.aml.checks.adverseMedia}
                          onCheckedChange={(checked) => updateEvaluationField('aml', 'checks', {
                            ...evaluation.aml.checks,
                            adverseMedia: checked
                          })}
                        />
                        <Label>Adverse Media Check</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evaluation.aml.checks.sourceOfFunds}
                          onCheckedChange={(checked) => updateEvaluationField('aml', 'checks', {
                            ...evaluation.aml.checks,
                            sourceOfFunds: checked
                          })}
                        />
                        <Label>Source of Funds</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>AML Notes</Label>
                      <Textarea
                        value={evaluation.aml.notes}
                        onChange={(e) => updateEvaluationField('aml', 'notes', e.target.value)}
                        placeholder="Enter AML compliance notes..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Label>AML Status</Label>
                        <Select
                          value={evaluation.aml.status}
                          onValueChange={(value) => updateEvaluationField('aml', 'status', value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={() => saveEvaluation('aml', evaluation.aml)}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save AML
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Risk Assessment Tab */}
            <TabsContent value="risk">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Trade Finance Risk Assessment Checklist</span>
                      </CardTitle>
                      <CardDescription>Comprehensive risk evaluation using industry standards</CardDescription>
                    </div>
                    {getStepBadge(evaluation.riskAssessment.status)}
                  </CardHeader>
                </Card>

                {/* Counterparty Risk Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Counterparty Risk</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Borrower Credit Assessment */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">1. Borrower Credit Assessment</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.counterpartyRisk?.borrowerCredit?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> What is the borrower's credit rating? Any recent defaults? Debt-to-income ratio?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Audited financial statements (3 years), credit reports, bank references
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.counterpartyRisk?.borrowerCredit?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('counterpartyRisk', 'borrowerCredit', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.counterpartyRisk?.borrowerCredit?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.counterpartyRisk?.borrowerCredit?.notes || ''}
                        onChange={(e) => updateChecklistItem('counterpartyRisk', 'borrowerCredit', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Supplier/Buyer Verification */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">2. Supplier/Buyer Verification</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.counterpartyRisk?.supplierVerification?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> Is the trading partner legitimate? Any history of disputes? Financial capacity?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Certificate of incorporation, trade licenses, bank statements, trade references
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.counterpartyRisk?.supplierVerification?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('counterpartyRisk', 'supplierVerification', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.counterpartyRisk?.supplierVerification?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.counterpartyRisk?.supplierVerification?.notes || ''}
                        onChange={(e) => updateChecklistItem('counterpartyRisk', 'supplierVerification', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Management Quality Assessment */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">3. Management Quality Assessment</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.counterpartyRisk?.managementQuality?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> Does management have relevant industry experience? Any red flags in background?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Management CVs, company organizational chart, board resolutions
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.counterpartyRisk?.managementQuality?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('counterpartyRisk', 'managementQuality', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.counterpartyRisk?.managementQuality?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.counterpartyRisk?.managementQuality?.notes || ''}
                        onChange={(e) => updateChecklistItem('counterpartyRisk', 'managementQuality', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Relationship History */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">4. Relationship History</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.counterpartyRisk?.relationshipHistory?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> How long is the relationship? Any past payment issues? Performance trends?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Transaction history, payment records, previous credit assessments
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.counterpartyRisk?.relationshipHistory?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('counterpartyRisk', 'relationshipHistory', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.counterpartyRisk?.relationshipHistory?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.counterpartyRisk?.relationshipHistory?.notes || ''}
                        onChange={(e) => updateChecklistItem('counterpartyRisk', 'relationshipHistory', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Structure Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transaction Structure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Collateral Evaluation */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">5. Collateral Evaluation</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.transactionStructure?.collateralEvaluation?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> What is the collateral recovery value? Legal enforceability? Market liquidity?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Asset valuations, insurance policies, warehouse receipts, pledge agreements
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.transactionStructure?.collateralEvaluation?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('transactionStructure', 'collateralEvaluation', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.transactionStructure?.collateralEvaluation?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.transactionStructure?.collateralEvaluation?.notes || ''}
                        onChange={(e) => updateChecklistItem('transactionStructure', 'collateralEvaluation', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Trade Documentation Review */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">6. Trade Documentation Review</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.transactionStructure?.tradeDocumentation?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> Are documents authentic? Any discrepancies? Compliance with terms?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Letters of credit, bills of lading, commercial invoices, packing lists
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.transactionStructure?.tradeDocumentation?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('transactionStructure', 'tradeDocumentation', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.transactionStructure?.tradeDocumentation?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.transactionStructure?.tradeDocumentation?.notes || ''}
                        onChange={(e) => updateChecklistItem('transactionStructure', 'tradeDocumentation', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Payment Terms Analysis */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">7. Payment Terms Analysis</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.transactionStructure?.paymentTerms?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> Is the transaction self-liquidating? Payment timing alignment? Default scenarios?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Sales contracts, purchase orders, payment agreements
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.transactionStructure?.paymentTerms?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('transactionStructure', 'paymentTerms', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.transactionStructure?.paymentTerms?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.transactionStructure?.paymentTerms?.notes || ''}
                        onChange={(e) => updateChecklistItem('transactionStructure', 'paymentTerms', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Transaction Purpose Verification */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">8. Transaction Purpose Verification</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.transactionStructure?.transactionPurpose?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> Is the trade flow genuine? Economic substance? Business rationale?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Purchase contracts, shipping documents, customs declarations
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.transactionStructure?.transactionPurpose?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('transactionStructure', 'transactionPurpose', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.transactionStructure?.transactionPurpose?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.transactionStructure?.transactionPurpose?.notes || ''}
                        onChange={(e) => updateChecklistItem('transactionStructure', 'transactionPurpose', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Market & Commodity Risk Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Market & Commodity Risk</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Commodity Price Risk */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">9. Commodity Price Risk</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.marketCommodityRisk?.commodityPrice?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> How volatile are commodity prices? Price trends? Hedging mechanisms?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Market analysis reports, price forecasts, hedging agreements
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.commodityPrice?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('marketCommodityRisk', 'commodityPrice', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.marketCommodityRisk?.commodityPrice?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.commodityPrice?.notes || ''}
                        onChange={(e) => updateChecklistItem('marketCommodityRisk', 'commodityPrice', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Market Demand Assessment */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">10. Market Demand Assessment</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.marketCommodityRisk?.marketDemand?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> Is there stable demand? Market growth prospects? Competitive landscape?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Market research, industry reports, customer contracts
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.marketDemand?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('marketCommodityRisk', 'marketDemand', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.marketCommodityRisk?.marketDemand?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.marketDemand?.notes || ''}
                        onChange={(e) => updateChecklistItem('marketCommodityRisk', 'marketDemand', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Currency Risk Evaluation */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">11. Currency Risk Evaluation</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.marketCommodityRisk?.currencyRisk?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> What is the FX exposure? Currency stability? Hedging options available?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Currency analysis, hedging contracts, FX forecasts
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.currencyRisk?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('marketCommodityRisk', 'currencyRisk', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.marketCommodityRisk?.currencyRisk?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.currencyRisk?.notes || ''}
                        onChange={(e) => updateChecklistItem('marketCommodityRisk', 'currencyRisk', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>

                    {/* Supply Chain Stability */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">12. Supply Chain Stability</h4>
                        {getChecklistStatusIcon(evaluation.riskAssessment.checklist?.marketCommodityRisk?.supplyChainStability?.status || 'pending')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Key Question:</strong> How resilient is the supply chain? Alternative suppliers? Disruption risks?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Required Docs:</strong> Supplier agreements, logistics contracts, contingency plans
                      </p>
                      <div className="flex items-center space-x-4 my-3">
                        <Select
                          value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.supplyChainStability?.status || 'pending'}
                          onValueChange={(value) => updateChecklistItem('marketCommodityRisk', 'supplyChainStability', 'status', value)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        {getChecklistStatusBadge(evaluation.riskAssessment.checklist?.marketCommodityRisk?.supplyChainStability?.status || 'pending')}
                      </div>
                      <Textarea
                        value={evaluation.riskAssessment.checklist?.marketCommodityRisk?.supplyChainStability?.notes || ''}
                        onChange={(e) => updateChecklistItem('marketCommodityRisk', 'supplyChainStability', 'notes', e.target.value)}
                        placeholder="Enter assessment notes..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Risk Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overall Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Risk Factors</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Country Risk</Label>
                            <Select
                              value={evaluation.riskAssessment.factors.country}
                              onValueChange={(value) => updateEvaluationField('riskAssessment', 'factors', {
                                ...evaluation.riskAssessment.factors,
                                country: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low Risk</SelectItem>
                                <SelectItem value="medium">Medium Risk</SelectItem>
                                <SelectItem value="high">High Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Industry Risk</Label>
                            <Select
                              value={evaluation.riskAssessment.factors.industry}
                              onValueChange={(value) => updateEvaluationField('riskAssessment', 'factors', {
                                ...evaluation.riskAssessment.factors,
                                industry: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low Risk</SelectItem>
                                <SelectItem value="medium">Medium Risk</SelectItem>
                                <SelectItem value="high">High Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Additional Factors</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Transaction Amount Risk</Label>
                            <Select
                              value={evaluation.riskAssessment.factors.transactionAmount}
                              onValueChange={(value) => updateEvaluationField('riskAssessment', 'factors', {
                                ...evaluation.riskAssessment.factors,
                                transactionAmount: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low Risk</SelectItem>
                                <SelectItem value="medium">Medium Risk</SelectItem>
                                <SelectItem value="high">High Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Client Profile Risk</Label>
                            <Select
                              value={evaluation.riskAssessment.factors.clientProfile}
                              onValueChange={(value) => updateEvaluationField('riskAssessment', 'factors', {
                                ...evaluation.riskAssessment.factors,
                                clientProfile: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low Risk</SelectItem>
                                <SelectItem value="medium">Medium Risk</SelectItem>
                                <SelectItem value="high">High Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Overall Risk Level</Label>
                      <Select
                        value={evaluation.riskAssessment.riskLevel}
                        onValueChange={(value) => updateEvaluationField('riskAssessment', 'riskLevel', value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Risk Assessment Summary</Label>
                      <Textarea
                        value={evaluation.riskAssessment.notes}
                        onChange={(e) => updateEvaluationField('riskAssessment', 'notes', e.target.value)}
                        placeholder="Enter comprehensive risk assessment summary..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Label>Risk Decision</Label>
                        <Select
                          value={evaluation.riskAssessment.status}
                          onValueChange={(value) => updateEvaluationField('riskAssessment', 'status', value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={() => saveEvaluation('riskAssessment', evaluation.riskAssessment)}
                        disabled={saving}
                        size="lg"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Risk Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Final Review Tab */}
            <TabsContent value="final">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Final Review & Decision</span>
                  </CardTitle>
                  <CardDescription>Complete the evaluation and make final decision</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Credit Scoring</h4>
                        {getStepBadge(evaluation.creditScoring.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Score: {evaluation.creditScoring.score}/100
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">KYC & AML</h4>
                        <div className="flex space-x-1">
                          {getStepBadge(evaluation.kyc.status)}
                          {getStepBadge(evaluation.aml.status)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Identity & Compliance
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Risk Assessment</h4>
                        {getStepBadge(evaluation.riskAssessment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Risk Level: {evaluation.riskAssessment.riskLevel}
                      </p>
                    </Card>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Final Notes</Label>
                    <Textarea
                      value={evaluation.finalNotes}
                      onChange={(e) => updateEvaluationField('evaluation', 'finalNotes', e.target.value)}
                      placeholder="Enter final evaluation summary and recommendations..."
                      rows={4}
                    />
                  </div>

                  {/* Evaluation Progress Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-lg">Evaluation Progress</h4>
                        <p className="text-sm text-muted-foreground">
                          {evaluation.completedSteps}/3 evaluation steps completed
                        </p>
                      </div>
                      <Badge 
                        variant={evaluation.completedSteps >= 3 ? "default" : "secondary"}
                        className={evaluation.completedSteps >= 3 ? "bg-green-100 text-green-800" : ""}
                      >
                        {evaluation.completedSteps >= 3 ? "ALL STEPS COMPLETED" : "IN PROGRESS"}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(evaluation.completedSteps / 3) * 100}%` }}
                      ></div>
                    </div>
                    
                    {/* Step-by-step progress */}
                    <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                      <div className={`flex items-center space-x-2 ${evaluation.creditScoring?.status !== 'pending' ? 'text-green-600' : 'text-gray-500'}`}>
                        {evaluation.creditScoring?.status !== 'pending' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span>Credit Scoring</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${evaluation.kyc?.status !== 'pending' && evaluation.aml?.status !== 'pending' ? 'text-green-600' : 'text-gray-500'}`}>
                        {evaluation.kyc?.status !== 'pending' && evaluation.aml?.status !== 'pending' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span>KYC & AML</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${evaluation.riskAssessment?.status !== 'pending' ? 'text-green-600' : 'text-gray-500'}`}>
                        {evaluation.riskAssessment?.status !== 'pending' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span>Risk Assessment</span>
                      </div>
                    </div>
                  </div>

                  {/* Memo Download Section */}
                  {evaluation.completedSteps >= 3 ? (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Evaluation Complete - Memo Available</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-4">
                        All three evaluation steps have been completed. You can now download the comprehensive evaluation memo.
                      </p>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="default"
                          onClick={downloadEvaluationMemo}
                          disabled={generatingMemo}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                        >
                          {generatingMemo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span>Download Evaluation Memo</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <h4 className="font-medium text-orange-800">Complete All Steps to Generate Memo</h4>
                      </div>
                      <p className="text-sm text-orange-700">
                        Please complete all three evaluation steps (Credit Scoring, KYC & AML, Risk Assessment) before downloading the evaluation memo.
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Final Evaluation Status</h4>
                      <Badge 
                        variant={
                          evaluation.overallStatus === 'approved' ? 'default' : 
                          evaluation.overallStatus === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className="text-lg px-4 py-2"
                      >
                        {evaluation.overallStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Application Details (Collapsible) */}
          {showDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Complete Application Details</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive view of all submitted application data (6 Steps)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[800px] overflow-y-auto">
                <ComprehensiveApplicationDisplay 
                  application={application}
                  handleDocumentView={handleDocumentView}
                  handleDocumentDownload={handleDocumentDownload}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}