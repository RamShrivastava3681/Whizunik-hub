import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Users, 
  UserCheck, 
  DollarSign, 
  FileText, 
  Eye, 
  Download 
} from "lucide-react";

interface ApplicationData {
  businessInfo?: any;
  shareholdersInfo?: any;
  principalsInfo?: any;
  financialRequestInfo?: any;
  bankDetailsInfo?: any;
  documentSubmissionInfo?: any;
}

interface Application {
  _id: string;
  clientName: string;
  companyName: string;
  email?: string;
  status: string;
  salesmanId?: string;
  linkToken?: string;
  password?: string;
  documents?: any[];
  createdAt: string;
  updatedAt?: string;
  applicationData?: ApplicationData;
}

interface Props {
  application: Application;
  handleDocumentView: (id: string, name: string) => void;
  handleDocumentDownload: (id: string, name: string) => void;
}

export const ComprehensiveApplicationDisplay: React.FC<Props> = ({
  application,
  handleDocumentView,
  handleDocumentDownload
}) => {
  // Check if we have the basic application data
  if (!application.companyName && !application.clientName) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No application data submitted yet</p>
      </div>
    );
  }

  // Work with the actual data structure from MongoDB
  // The real applications have fields like companyName, clientName, email, etc. directly

  return (
    <div className="space-y-6">
      
      {/* Real Company Information */}
      <div className="border-l-4 border-blue-500 pl-4">
        <div className="flex items-center space-x-2 mb-3">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">Company Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 border-b pb-1">Basic Details</h4>
            <div>
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <p className="text-sm font-medium">{application.companyName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Client Name</Label>
              <p className="text-sm">{application.clientName}</p>
            </div>
            {application.email && (
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{application.email}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 border-b pb-1">Application Status</h4>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge variant="outline" className="ml-2">{application.status}</Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Application ID</Label>
              <p className="text-sm font-mono text-gray-600">{application._id}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm">{new Date(application.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Information */}
      <div className="border-l-4 border-orange-500 pl-4">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-800">Documents Submitted</h3>
        </div>
        
        {application.documents && application.documents.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 border-b pb-1">Document Status</h4>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Documents</Label>
                  <p className="text-lg font-bold text-orange-600">
                    {application.documents.reduce((total, doc) => total + (doc.documentCount || 1), 0)} Files
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Upload Status</Label>
                  <Badge variant="outline" className="ml-2">
                    {application.documents[0]?.status || 'uploaded'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 border-b pb-1">Upload Timeline</h4>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Upload</Label>
                  <p className="text-sm">{new Date(application.documents[0]?.uploadedAt || application.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Application Created</Label>
                  <p className="text-sm">{new Date(application.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {/* Document List with View/Download Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 border-b pb-1">Document Actions</h4>
              {application.documents.map((doc, index) => (
                <div key={index} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">
                          {doc.fileName || doc.originalName || `Document ${index + 1}`}
                        </p>
                        <p className="text-sm text-orange-600">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          {doc.documentCount && ` • ${doc.documentCount} files`}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentView(doc._id || `doc-${index}`, doc.fileName || `Document_${index + 1}.pdf`)}
                        className="text-orange-600 border-orange-300 hover:bg-orange-100"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentDownload(doc._id || `doc-${index}`, doc.fileName || `Document_${index + 1}.pdf`)}
                        className="text-orange-600 border-orange-300 hover:bg-orange-100"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No documents uploaded yet</p>
        )}
      </div>

      {/* Application Status Summary */}
      <div className="border-l-4 border-green-500 pl-4">
        <div className="flex items-center space-x-2 mb-3">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Application Summary</h3>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Company</Label>
              <p className="font-medium">{application.companyName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Primary Contact</Label>
              <p className="font-medium">{application.clientName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Application Status</Label>
              <Badge variant={application.status === 'submitted' ? 'default' : 'secondary'} className="ml-1">
                {application.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};