import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Mail, Phone, Building, MapPin, User, Briefcase, DollarSign, Calendar as CalendarIcon, Star, TrendingUp, Filter, Search, Zap, FileText, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { authService } from "@/lib/auth";

interface PotentialClient {
  _id: string;
  companyName: string;
  address: string;
  phoneNumber: string;
  contactName: string;
  source: string;
  nextContactDate: string;
  financingFee: number;
  contactPhone: string;
  country: string;
  industry: string;
  product: string;
  type: string;
  email: string;
  dealAmount: number;
  contactTitle: string;
  officer: string;
  observations?: string;
  status: 'potential' | 'contacted' | 'interested' | 'proposal_sent' | 'negotiating' | 'converted' | 'rejected';
  notes?: string;
  createdAt: string;
}

interface PotentialClientsProps {
  className?: string;
}

export function PotentialClients({ className }: PotentialClientsProps) {
  const [clients, setClients] = useState<PotentialClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PotentialClient | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phoneNumber: '',
    contactName: '',
    source: '',
    nextContactDate: '',
    financingFee: '',
    contactPhone: '',
    country: '',
    industry: '',
    product: '',
    type: '',
    email: '',
    dealAmount: '',
    contactTitle: '',
    officer: '',
    observations: '',
    notes: ''
  });
  const { toast } = useToast();

  // Configure axios with auth token
  axios.defaults.headers.common['Authorization'] = `Bearer ${authService.getToken()}`;

  // Ensure clients is always an array
  const safeClients = clients || [];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('🔍 PotentialClients: Fetching clients...');
      const response = await axios.get('/potential-clients');
      
      console.log('🔍 PotentialClients: Response:', response.data);
      
      // Handle different response formats
      if (response.data.success !== undefined) {
        // If response has success field
        if (response.data.success) {
          const clientsData = response.data.data || [];
          console.log('🔍 PotentialClients: Setting clients:', clientsData);
          setClients(clientsData);
        } else {
          console.log('❌ PotentialClients: API returned success: false');
          setClients([]);
        }
      } else {
        // If response data is directly the array
        const clientsData = Array.isArray(response.data) ? response.data : [];
        console.log('🔍 PotentialClients: Setting clients (direct array):', clientsData);
        setClients(clientsData);
      }
    } catch (error: any) {
      console.error('❌ PotentialClients: Error fetching clients:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch potential clients",
        variant: "destructive",
      });
      // Ensure clients is always an array even on error
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clientData = {
        companyName: formData.companyName,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        contactName: formData.contactName,
        source: formData.source,
        nextContactDate: formData.nextContactDate,
        financingFee: parseFloat(formData.financingFee) || 0,
        contactPhone: formData.contactPhone,
        country: formData.country,
        industry: formData.industry,
        product: formData.product,
        type: formData.type,
        email: formData.email,
        dealAmount: parseFloat(formData.dealAmount) || 0,
        contactTitle: formData.contactTitle,
        officer: formData.officer,
        observations: formData.observations,
        notes: formData.notes
      };

      // Create new client
      const response = await axios.post('/potential-clients', clientData);
      
      toast({
        title: "Success",
        description: "Potential client created successfully",
      });

      setDialogOpen(false);
      setFormData({
        companyName: '',
        address: '',
        phoneNumber: '',
        contactName: '',
        source: '',
        nextContactDate: '',
        financingFee: '',
        contactPhone: '',
        country: '',
        industry: '',
        product: '',
        type: '',
        email: '',
        dealAmount: '',
        contactTitle: '',
        officer: '',
        observations: '',
        notes: ''
      });
      fetchClients();
    } catch (error: any) {
      console.error('Error saving potential client:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save potential client",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500';
    switch (status) {
      case 'converted': return 'bg-green-500';
      case 'interested': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className={className}>
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="bg-white/20 rounded-full p-2">
                <Users className="h-6 w-6" />
              </div>
              All Current Clients
              {safeClients.length > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {safeClients.length} total
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              Manage all your client contacts, leads, and potential clients with advanced insights
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setFormData({
                    companyName: '',
                    address: '',
                    phoneNumber: '',
                    contactName: '',
                    source: '',
                    nextContactDate: '',
                    financingFee: '',
                    contactPhone: '',
                    country: '',
                    industry: '',
                    product: '',
                    type: '',
                    email: '',
                    dealAmount: '',
                    contactTitle: '',
                    officer: '',
                    observations: '',
                    notes: ''
                  });
                }}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Add New Potential Client
                </DialogTitle>
                <DialogDescription>
                  Enter the details for the new potential client.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Company name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry *</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g., Manufacturing, Trading"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Country"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client type" />
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
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Complete address"
                      required
                      rows={2}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Contact person name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactTitle">Contact Title *</Label>
                      <Input
                        id="contactTitle"
                        value={formData.contactTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactTitle: e.target.value }))}
                        placeholder="e.g., CEO, Manager, Director"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contact@company.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone *</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="Direct contact phone"
                      required
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Business Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product">Product *</Label>
                      <Input
                        id="product"
                        value={formData.product}
                        onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                        placeholder="Products/Services"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dealAmount">Deal Amount (USD) *</Label>
                      <Input
                        id="dealAmount"
                        type="number"
                        value={formData.dealAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, dealAmount: e.target.value }))}
                        placeholder="0"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="financingFee">Financing Fee (USD) *</Label>
                    <Input
                      id="financingFee"
                      type="number"
                      value={formData.financingFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, financingFee: e.target.value }))}
                      placeholder="0"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Sales Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Sales Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="source">Source *</Label>
                      <Select 
                        value={formData.source} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cold_call">Cold Call</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="exhibition">Exhibition</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="email_campaign">Email Campaign</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="officer">Officer (Internal Employee) *</Label>
                      <Input
                        id="officer"
                        value={formData.officer}
                        onChange={(e) => setFormData(prev => ({ ...prev, officer: e.target.value }))}
                        placeholder="Assigned officer name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nextContactDate">Next Contact Date *</Label>
                    <Input
                      id="nextContactDate"
                      type="date"
                      value={formData.nextContactDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextContactDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Notes and Observations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                  <div>
                    <Label htmlFor="observations">Observations</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                      placeholder="Key observations about the client or opportunity"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Client
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* Client Detail Modal */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg -m-6 mb-6">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="bg-white/20 rounded-full p-2">
                  <Users className="h-6 w-6" />
                </div>
                {selectedClient?.contactName} - {selectedClient?.companyName}
              </DialogTitle>
              <DialogDescription className="text-blue-100 mt-2">
                Complete client information and contact details with business insights
              </DialogDescription>
            </DialogHeader>
            
            {selectedClient && (
              <div className="space-y-6">
                {/* Status and Key Metrics */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl shadow-lg">
                      {selectedClient?.contactName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <Badge className={`${getStatusColor(selectedClient.status)} text-white text-sm px-4 py-2 shadow-md`}>
                        {selectedClient.status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Created: {formatDate(selectedClient.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatCurrency(selectedClient.dealAmount || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Deal Amount</div>
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Financing Fee: {formatCurrency(selectedClient.financingFee || 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Information */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
                    <h3 className="text-lg font-semibold border-b border-blue-200 pb-3 mb-4 flex items-center gap-2">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      Company Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-600 font-medium">Company Name</p>
                          <p className="font-semibold text-gray-900">{selectedClient?.companyName || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-gray-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 font-medium">Country</p>
                          <p className="font-semibold text-gray-900">{selectedClient?.country || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <Briefcase className="h-5 w-5 text-green-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium">Industry</p>
                          <p className="font-semibold text-gray-900">{selectedClient.industry}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <Building className="h-5 w-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-purple-600 font-medium">Type</p>
                          <p className="font-semibold text-gray-900 capitalize">{selectedClient.type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium mb-2">Address</p>
                        <p className="font-semibold text-gray-900">{selectedClient.address}</p>
                      </div>
                      
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-600 font-medium mb-2">Products/Services</p>
                        <p className="font-semibold text-gray-900">{selectedClient.product}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
                    <h3 className="text-lg font-semibold border-b border-green-200 pb-3 mb-4 flex items-center gap-2">
                      <div className="bg-green-100 rounded-full p-2">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      Contact Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <User className="h-5 w-5 text-green-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium">Contact Person</p>
                          <p className="font-semibold text-gray-900">{selectedClient.contactName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <Briefcase className="h-5 w-5 text-orange-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-orange-600 font-medium">Title</p>
                          <p className="font-semibold text-gray-900">{selectedClient.contactTitle}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-600 font-medium">Email</p>
                          <a href={`mailto:${selectedClient.email}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                            {selectedClient.email}
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <Phone className="h-5 w-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-purple-600 font-medium">Phone Number</p>
                          <a href={`tel:${selectedClient.phoneNumber}`} className="font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-colors">
                            {selectedClient.phoneNumber}
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                        <Phone className="h-5 w-5 text-indigo-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-indigo-600 font-medium">Contact Phone</p>
                          <a href={`tel:${selectedClient.contactPhone}`} className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
                            {selectedClient.contactPhone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business & Sales Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100">
                    <h3 className="text-lg font-semibold border-b border-emerald-200 pb-3 mb-4 flex items-center gap-2">
                      <div className="bg-emerald-100 rounded-full p-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                      </div>
                      Business Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <DollarSign className="h-6 w-6 text-emerald-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-emerald-600 font-medium">Deal Amount</p>
                          <p className="font-bold text-xl text-emerald-800">{formatCurrency(selectedClient.dealAmount || 0)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium">Financing Fee</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(selectedClient.financingFee || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
                    <h3 className="text-lg font-semibold border-b border-blue-200 pb-3 mb-4 flex items-center gap-2">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      Sales Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-600 font-medium">Source</p>
                          <p className="font-semibold text-gray-900 capitalize">{selectedClient.source?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <User className="h-5 w-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-purple-600 font-medium">Assigned Officer</p>
                          <p className="font-semibold text-gray-900">{selectedClient.officer}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-orange-600 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-orange-600 font-medium">Next Contact Date</p>
                          <p className="font-semibold text-gray-900">{formatDate(selectedClient.nextContactDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes and Observations */}
                {(selectedClient.observations || selectedClient.notes) && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
                    <h3 className="text-lg font-semibold border-b border-amber-200 pb-3 mb-4 flex items-center gap-2">
                      <div className="bg-amber-100 rounded-full p-2">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      Additional Information
                    </h3>
                    
                    <div className="space-y-4">
                      {selectedClient.observations && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-600 font-medium mb-2">Observations</p>
                          <p className="text-gray-900 leading-relaxed">{selectedClient.observations}</p>
                        </div>
                      )}
                      
                      {selectedClient.notes && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-600 font-medium mb-2">Notes</p>
                          <p className="text-gray-900 leading-relaxed">{selectedClient.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={() => setDetailDialogOpen(false)}
                    className="px-6 py-2 border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => window.open(`mailto:${selectedClient.email}`, '_blank')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                  >
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

        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-blue-200 mx-auto opacity-25"></div>
              </div>
              <p className="text-muted-foreground font-medium">Loading potential clients...</p>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch your data</p>
            </div>
          ) : (safeClients.length === 0) ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your client database by adding your first client. Track leads, manage relationships, and grow your business.
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Converted</p>
                      <p className="text-2xl font-bold">
                        {safeClients.filter(c => c.status === 'converted').length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Interested</p>
                      <p className="text-2xl font-bold">
                        {safeClients.filter(c => c.status === 'interested').length}
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Contacted</p>
                      <p className="text-2xl font-bold">
                        {safeClients.filter(c => c.status === 'contacted').length}
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-yellow-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Value</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(safeClients.reduce((sum, c) => sum + (c.dealAmount || 0), 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Client Cards */}
              <div className="space-y-4">
                {safeClients.map((client) => (
                  <div 
                    key={client._id} 
                    className="group border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transform hover:-translate-y-1"
                    onClick={() => handleClientClick(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                            {client.contactName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                              {client.contactName || 'Unknown Contact'}
                            </h3>
                            <p className="text-gray-600 font-medium">{client.companyName || 'Unknown Company'}</p>
                          </div>
                          <Badge className={`${getStatusColor(client.status)} text-white shadow-md px-3 py-1`}>
                            {client.status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-blue-100 rounded-full p-2">
                              <Building className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{client.industry}</p>
                              <p className="text-xs text-gray-500">Industry</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 rounded-full p-2">
                              <Mail className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{client.email}</p>
                              <p className="text-xs text-gray-500">Email</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-purple-100 rounded-full p-2">
                              <Phone className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{client.phoneNumber}</p>
                              <p className="text-xs text-gray-500">Phone</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-green-700">
                              Deal: {formatCurrency(client.dealAmount || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700">Officer: {client.officer}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            💡 Click to view full details
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 text-sm font-medium">
                            View Details →
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
