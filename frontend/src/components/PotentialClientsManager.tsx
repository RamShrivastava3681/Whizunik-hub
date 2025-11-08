import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { API_CONFIG } from "../config/api";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Building2, 
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  User,
  Briefcase,
  Upload,
  FileText,
  Download
} from "lucide-react";

interface PotentialClient {
  _id?: string;
  companyName: string;
  address: string;
  country: string;
  industry: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phoneNumber: string;
  contactPhone: string;
  products: string;
  type: 'exporter' | 'importer' | 'manufacturer' | 'trader' | 'service_provider' | 'other';
  dealAmount: number;
  financingFee: number;
  source: 'cold_call' | 'referral' | 'website' | 'exhibition' | 'linkedin' | 'email_campaign' | 'other';
  nextContactDate?: Date | string;
  officer: string;
  status: 'potential' | 'contacted' | 'interested' | 'proposal_sent' | 'negotiating' | 'converted' | 'rejected';
  notes?: string;
  tags?: string[];
  lastContactDate?: Date | string;
  createdAt?: string;
  updatedAt?: string;
}

interface PotentialClientsManagerProps {
  userId: string;
}

// Set up axios base URL
axios.defaults.baseURL = API_CONFIG.BASE_URL;

// Helper function to get auth token from cookie
const getAuthToken = () => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth-token=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export function PotentialClientsManager({ userId }: PotentialClientsManagerProps) {
  const [clients, setClients] = useState<PotentialClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<PotentialClient | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PotentialClient | null>(null);
  
  // CSV Import related state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<PotentialClient>>({
    companyName: "",
    address: "",
    country: "",
    industry: "",
    contactName: "",
    contactTitle: "",
    email: "",
    phoneNumber: "",
    contactPhone: "",
    products: "",
    type: "exporter",
    dealAmount: undefined,
    financingFee: undefined,
    source: "cold_call",
    nextContactDate: new Date(),
    officer: "",
    status: "potential",
    notes: "",
    tags: []
  });

  // Separate state for form input strings
  const [formInputs, setFormInputs] = useState({
    dealAmount: '',
    financingFee: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.error('No auth token found');
        toast({
          title: "Authentication Error",
          description: "Please log in to access client data",
          variant: "destructive"
        });
        return;
      }
      
      const response = await axios.get('/potential-clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Ensure we always set an array
      const clientsData = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.data?.data) 
          ? response.data.data 
          : [];
          
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Ensure clients is set to empty array on error
      setClients([]);
      toast({
        title: "Error",
        description: "Failed to fetch potential clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to save client data",
          variant: "destructive"
        });
        return;
      }
      
      const clientData = {
        ...formData,
        nextContactDate: formData.nextContactDate || new Date(),
        dealAmount: Number(formData.dealAmount),
        financingFee: Number(formData.financingFee)
      };

      const authHeaders = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      if (editingClient) {
        await axios.put(`/potential-clients/${editingClient._id}`, clientData, authHeaders);
        toast({
          title: "Success",
          description: "Client updated successfully"
        });
      } else {
        await axios.post('/potential-clients', clientData, authHeaders);
        toast({
          title: "Success",
          description: "Client created successfully"
        });
      }

      setIsCreateDialogOpen(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (client: PotentialClient) => {
    setEditingClient(client);
    setFormData({
      ...client,
      nextContactDate: client.nextContactDate ? new Date(client.nextContactDate) : new Date()
    });
    setFormInputs({
      dealAmount: client.dealAmount?.toString() || '',
      financingFee: client.financingFee?.toString() || ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to delete client data",
          variant: "destructive"
        });
        return;
      }
      
      await axios.delete(`/potential-clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  // CSV Upload and Processing Functions
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive"
      });
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      
      setCsvData(data);
      setShowCSVDialog(true);
    };
    reader.readAsText(file);
  };

  const mapCSVToClient = (csvRow: any): Partial<PotentialClient> => {
    return {
      companyName: csvRow.companyName || csvRow['Company Name'] || csvRow.company || '',
      contactName: csvRow.contactName || csvRow['Contact Name'] || csvRow.name || '',
      email: csvRow.email || csvRow['Email'] || csvRow.emailAddress || '',
      phoneNumber: csvRow.phoneNumber || csvRow['Phone'] || csvRow.phone || '',
      contactPhone: csvRow.contactPhone || csvRow['Contact Phone'] || csvRow.phoneNumber || csvRow.phone || '',
      address: csvRow.address || csvRow['Address'] || '',
      country: csvRow.country || csvRow['Country'] || 'USA',
      industry: csvRow.industry || csvRow['Industry'] || '',
      contactTitle: csvRow.contactTitle || csvRow['Contact Title'] || csvRow.position || '',
      products: csvRow.products || csvRow['Products'] || '',
      type: csvRow.type || 'other',
      dealAmount: parseFloat(csvRow.dealAmount || csvRow['Deal Amount'] || '0') || 0,
      financingFee: parseFloat(csvRow.financingFee || csvRow['Financing Fee'] || '0') || 0,
      source: csvRow.source || 'other',
      officer: csvRow.officer || csvRow['Officer'] || '',
      notes: csvRow.notes || csvRow['Notes'] || '',
      status: 'potential'
    };
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) return;
    
    const token = getAuthToken();
    
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to import client data",
        variant: "destructive"
      });
      return;
    }
    
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of csvData) {
        try {
          const clientData = mapCSVToClient(row);
          await axios.post('/potential-clients', clientData, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          successCount++;
        } catch (error) {
          console.error('Error importing row:', error);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} clients. ${errorCount} errors.`
      });

      if (successCount > 0) {
        fetchClients();
      }
      
      setShowCSVDialog(false);
      setCsvFile(null);
      setCsvData([]);
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Error",
        description: "Failed to import clients",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'companyName,contactName,email,phoneNumber,contactPhone,address,country,industry,contactTitle,products,type,dealAmount,financingFee,source,officer,notes',
      'ABC Corp,John Doe,john@abccorp.com,123-456-7890,123-456-7890,123 Main St,USA,Technology,CEO,Software Solutions,service_provider,1000000,50000,referral,Jane Smith,Initial contact made',
      'XYZ Inc,Jane Smith,jane@xyzinc.com,987-654-3210,987-654-3210,456 Oak Ave,USA,Healthcare,CTO,Medical Devices,manufacturer,500000,25000,website,John Doe,Follow up needed'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'potential_clients_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClientClick = (client: PotentialClient) => {
    setSelectedClient(client);
    setDetailDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'No date set';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      address: "",
      country: "",
      industry: "",
      contactName: "",
      contactTitle: "",
      email: "",
      phoneNumber: "",
      contactPhone: "",
      products: "",
      type: "exporter",
      dealAmount: 0,
      financingFee: 0,
      source: "cold_call",
      nextContactDate: new Date(),
      officer: "",
      status: "potential",
      notes: "",
      tags: []
    });
    setFormInputs({
      dealAmount: '',
      financingFee: ''
    });
  };

  // Ensure clients is always an array before filtering
  const safeClients = Array.isArray(clients) ? clients : [];
  
  const filteredClients = safeClients.filter(client => {
    const matchesSearch = 
      (client.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.contactName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'bg-green-100 text-green-800';
      case 'negotiating': return 'bg-blue-100 text-blue-800';
      case 'proposal_sent': return 'bg-purple-100 text-purple-800';
      case 'interested': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-indigo-100 text-indigo-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="potential">Potential</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingClient(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>

          {/* CSV Import Button */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadSampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Sample
            </Button>
          </div>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Edit Potential Client' : 'Add New Potential Client'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details for the potential client. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Manufacturing, Trading, Services"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Company Address *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter complete company address"
                        rows={2}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Enter country name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Business Type *</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exporter">Exporter</SelectItem>
                          <SelectItem value="importer">Importer</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="trader">Trader</SelectItem>
                          <SelectItem value="service_provider">Service Provider</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Person Name *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="Enter contact person's full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactTitle">Contact Title/Position *</Label>
                      <Input
                        id="contactTitle"
                        value={formData.contactTitle}
                        onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                        placeholder="e.g., CEO, Manager, Director"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Company Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="Enter company phone number"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Person Phone *</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="Enter contact person's direct phone"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Business Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="products">Products/Services *</Label>
                      <Textarea
                        id="products"
                        value={formData.products}
                        onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                        placeholder="Describe the products or services the client deals with..."
                        rows={2}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dealAmount">Expected Deal Amount (USD) *</Label>
                      <Input
                        id="dealAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formInputs.dealAmount}
                        onChange={(e) => {
                          setFormInputs({ ...formInputs, dealAmount: e.target.value });
                          setFormData({ ...formData, dealAmount: e.target.value === '' ? 0 : Number(e.target.value) });
                        }}
                        placeholder="Enter deal amount"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="financingFee">Potential Financing Fee (USD) *</Label>
                      <Input
                        id="financingFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formInputs.financingFee}
                        onChange={(e) => {
                          setFormInputs({ ...formInputs, financingFee: e.target.value });
                          setFormData({ ...formData, financingFee: e.target.value === '' ? 0 : Number(e.target.value) });
                        }}
                        placeholder="Enter estimated financing fee"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="source">Lead Source *</Label>
                      <Select value={formData.source} onValueChange={(value: any) => setFormData({ ...formData, source: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="How did you find this client?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cold_call">Cold Call</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="website">Website Inquiry</SelectItem>
                          <SelectItem value="exhibition">Trade Exhibition</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="email_campaign">Email Campaign</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Sales Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="officer">Assigned Officer (Salesman) *</Label>
                      <Input
                        id="officer"
                        value={formData.officer}
                        onChange={(e) => setFormData({ ...formData, officer: e.target.value })}
                        placeholder="Enter salesman/officer name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Current Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select current status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="potential">Potential Lead</SelectItem>
                          <SelectItem value="contacted">First Contact Made</SelectItem>
                          <SelectItem value="interested">Showed Interest</SelectItem>
                          <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                          <SelectItem value="negotiating">Under Negotiation</SelectItem>
                          <SelectItem value="converted">Successfully Converted</SelectItem>
                          <SelectItem value="rejected">Declined/Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Next Contact Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.nextContactDate ? format(formData.nextContactDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.nextContactDate}
                            onSelect={(date) => setFormData({ ...formData, nextContactDate: date || new Date() })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any additional notes, observations, or important details about this client..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingClient ? 'Update Client' : 'Create Client'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Client Detail Modal */}
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedClient?.contactName} - {selectedClient?.companyName}
                </DialogTitle>
                <DialogDescription>
                  Complete client information and contact details
                </DialogDescription>
              </DialogHeader>
              
              {selectedClient && (
                <div className="space-y-6">
                  {/* Status and Key Metrics */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(selectedClient.status)} text-white text-sm px-3 py-1`}>
                        {selectedClient.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Created: {formatDate(selectedClient.createdAt || new Date())}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedClient.dealAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">Deal Amount</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Company Name</p>
                            <p className="font-medium">{selectedClient.companyName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Country</p>
                            <p className="font-medium">{selectedClient.country}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Industry</p>
                            <p className="font-medium">{selectedClient.industry}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="font-medium capitalize">{selectedClient.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedClient.address}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Products/Services</p>
                          <p className="font-medium">{selectedClient.products}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Contact Person</p>
                            <p className="font-medium">{selectedClient.contactName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Title</p>
                            <p className="font-medium">{selectedClient.contactTitle}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">
                              <a href={`mailto:${selectedClient.email}`} className="text-primary hover:underline">
                                {selectedClient.email}
                              </a>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone Number</p>
                            <p className="font-medium">
                              <a href={`tel:${selectedClient.phoneNumber}`} className="text-primary hover:underline">
                                {selectedClient.phoneNumber}
                              </a>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Contact Phone</p>
                            <p className="font-medium">
                              <a href={`tel:${selectedClient.contactPhone}`} className="text-primary hover:underline">
                                {selectedClient.contactPhone}
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business & Sales Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Business Details</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Deal Amount</p>
                            <p className="font-medium text-lg">{formatCurrency(selectedClient.dealAmount)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Financing Fee</p>
                            <p className="font-medium">{formatCurrency(selectedClient.financingFee)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Sales Information</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Source</p>
                          <p className="font-medium capitalize">{selectedClient.source.replace('_', ' ')}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Assigned Officer</p>
                          <p className="font-medium">{selectedClient.officer}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Next Contact Date</p>
                            <p className="font-medium">{formatDate(selectedClient.nextContactDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedClient.notes && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Notes</p>
                        <p className="bg-muted/50 p-3 rounded-lg">{selectedClient.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                      Close
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setDetailDialogOpen(false);
                      handleEdit(selectedClient);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => window.open(`mailto:${selectedClient.email}`, '_blank')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button onClick={() => window.open(`tel:${selectedClient.phoneNumber}`, '_blank')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="text-center py-8">Loading clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card 
              key={client._id} 
              className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50"
              onClick={() => handleClientClick(client)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{client.companyName}</CardTitle>
                    <CardDescription>{client.industry}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{client.contactName} - {client.contactTitle}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{client.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{client.phoneNumber}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>Deal: {formatCurrency(client.dealAmount)}</span>
                </div>
                
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  Click to view full details
                </div>
                
                <div 
                  className="flex justify-end gap-2 pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client._id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Get started by adding your first potential client"
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          )}
        </div>
      )}

      {/* CSV Import Preview Dialog */}
      <Dialog open={showCSVDialog} onOpenChange={setShowCSVDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              CSV Import Preview
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Found {csvData.length} records in the CSV file. Review the data below and click "Import All" to proceed.
            </div>
            
            {csvData.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-r">Company</th>
                        <th className="text-left p-2 border-r">Contact</th>
                        <th className="text-left p-2 border-r">Email</th>
                        <th className="text-left p-2 border-r">Phone</th>
                        <th className="text-left p-2 border-r">Industry</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 10).map((row, index) => {
                        const mapped = mapCSVToClient(row);
                        return (
                          <tr key={index} className="border-t">
                            <td className="p-2 border-r">{mapped.companyName}</td>
                            <td className="p-2 border-r">{mapped.contactName}</td>
                            <td className="p-2 border-r">{mapped.email}</td>
                            <td className="p-2 border-r">{mapped.phoneNumber}</td>
                            <td className="p-2 border-r">{mapped.industry}</td>
                            <td className="p-2">{mapped.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 10 && (
                  <div className="p-2 text-xs text-muted-foreground bg-muted/20 border-t">
                    Showing first 10 rows of {csvData.length} total records
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                Column mapping: companyName, contactName, email, phoneNumber, contactPhone, address, country, industry, contactTitle, products, type, dealAmount, financingFee, source, officer, notes
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCSVDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkImport} 
                  disabled={isImporting || csvData.length === 0}
                  className="min-w-[120px]"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import All ({csvData.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
