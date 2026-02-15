import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { PolicyService } from '@/services/policyService';
import { InstallmentDashboardStats, InstallmentFilters, EnhancedInstallment, Policy, Installment } from '@/types/policy';
import PaymentProcessingModal from '@/components/policy/PaymentProcessingModal';
import { PolicyDetailView } from '@/components/policy/PolicyDetailView';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CreditCard,
} from 'lucide-react';

const InstallmentDashboard = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InstallmentFilters>({});
  const [selectedInstallment, setSelectedInstallment] = useState<EnhancedInstallment | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Fetch dashboard statistics
  const { 
    data: dashboardStats, 
    isLoading: isStatsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['installment-dashboard-stats'],
    queryFn: () => PolicyService.getInstallmentDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch all installments with filters
  const { 
    data: installmentsResponse, 
    isLoading: isInstallmentsLoading,
    refetch: refetchInstallments 
  } = useQuery({
    queryKey: ['all-installments', filters],
    queryFn: () => PolicyService.getAllInstallments(filters),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch overdue installments
  const { 
    data: overdueResponse, 
    isLoading: isOverdueLoading 
  } = useQuery({
    queryKey: ['overdue-installments'],
    queryFn: () => PolicyService.getOverdueInstallments(),
    staleTime: 60 * 1000, // 1 minute
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      customer_search: value || undefined,
    }));
  };

  const handleFilterChange = (key: keyof InstallmentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };
  
  const handleProcessPayment = (installment: EnhancedInstallment) => {
    if (installment.policy) {
      setSelectedInstallment(installment);
      setSelectedPolicy(installment.policy);
      setIsPaymentModalOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Policy information not available for this installment.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewDetails = (installment: EnhancedInstallment) => {
    if (installment.policy) {
      setSelectedPolicy(installment.policy);
      setIsDetailsDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Policy information not available for this installment.",
        variant: "destructive"
      });
    }
  };
  
  const handleSendReminder = (installmentId: number) => {
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the customer.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'waived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (daysOverdue?: number) => {
    if (!daysOverdue) return 'bg-gray-100 text-gray-800';
    if (daysOverdue <= 30) return 'bg-yellow-100 text-yellow-800';
    if (daysOverdue <= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (statsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load installment data. Please try again.
            <Button
              onClick={() => refetchStats()}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Installment Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive installment tracking and payment management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              refetchStats();
              refetchInstallments();
            }}
            variant="outline"
            disabled={isStatsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isStatsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {isStatsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Installments</p>
                  <p className="text-2xl font-bold">{dashboardStats.overview.total_installments}</p>
                  <p className="text-sm text-green-600">
                    {dashboardStats.overview.collection_rate}% collected
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Amount</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(dashboardStats.financial.total_outstanding)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dashboardStats.overview.pending_installments + dashboardStats.overview.overdue_installments} pending
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Installments</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardStats.overview.overdue_installments}
                  </p>
                  <p className="text-sm text-gray-500">
                    Requires attention
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Late Fees Collected</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dashboardStats.financial.total_late_fees)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Additional revenue
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Installments</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by customer name, email, or policy number..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="waived">Waived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sort_by || 'due_date'}
                    onValueChange={(value) => handleFilterChange('sort_by', value === 'default' ? undefined : value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Order</SelectItem>
                      <SelectItem value="due_date">Due Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="policy_number">Policy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={clearFilters} variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installments List */}
          <Card>
            <CardHeader>
              <CardTitle>Installments</CardTitle>
            </CardHeader>
            <CardContent>
              {isInstallmentsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : installmentsResponse?.data?.length ? (
                <div className="space-y-3">
                  {installmentsResponse.data.map((installment: EnhancedInstallment) => (
                    <div key={installment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">
                            {installment.policy?.policy_number} - Installment #{installment.installment_number}
                          </div>
                          <Badge className={getStatusColor(installment.status)}>
                            {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                          </Badge>
                          {installment.is_overdue && installment.days_overdue && (
                            <Badge className={getPriorityColor(installment.days_overdue)}>
                              {installment.days_overdue} days overdue
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Customer: {installment.policy?.customer?.name} | 
                          Due: {new Date(installment.due_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                          {installment.paid_date && (
                            <span className="ml-2">
                              | Paid: {new Date(installment.paid_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-medium">
                          {formatCurrency(installment.amount)}
                        </div>
                        {installment.paid_amount > 0 && installment.status !== 'paid' && (
                          <div className="text-sm text-gray-500">
                            Paid: {formatCurrency(installment.paid_amount)}
                          </div>
                        )}
                        {installment.late_fee_amount > 0 && (
                          <div className="text-sm text-red-600">
                            Late Fee: {formatCurrency(installment.late_fee_amount)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetails(installment)}
                          title="View policy details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {installment.status !== 'paid' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleProcessPayment(installment)}
                            title="Process payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No installments found</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Overdue Installments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverdueLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : overdueResponse?.data?.data?.length ? (
                <div className="space-y-3">
                  {overdueResponse.data.data.map((installment: EnhancedInstallment) => (
                    <div key={installment.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-red-900">
                            {installment.policy?.policy_number} - Installment #{installment.installment_number}
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            {installment.days_overdue || 'N/A'} days overdue
                          </Badge>
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          Customer: {installment.policy?.customer?.name} | 
                          Due: {new Date(installment.due_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-medium text-red-900">
                          {formatCurrency(installment.total_amount_due || (installment.amount + (installment.late_fee_amount || 0)))}
                        </div>
                        <div className="text-sm text-red-700">
                          Principal: {formatCurrency(installment.remaining_amount || (installment.amount - installment.paid_amount))}
                        </div>
                        {installment.late_fee_amount > 0 && (
                          <div className="text-sm text-red-700">
                            Late Fee: {formatCurrency(installment.late_fee_amount)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(installment)}
                          title="View policy details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleSendReminder(installment.id)}
                        >
                          Send Reminder
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProcessPayment(installment)}
                        >
                          Process Payment
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No overdue installments</p>
                  <p className="text-sm mt-2">All payments are up to date!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {dashboardStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overdue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Overdue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>1-30 days</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-yellow-500 rounded-full" 
                            style={{ 
                              width: `${(dashboardStats.overdue_breakdown['1-30_days'] / Math.max(1, dashboardStats.overview.overdue_installments)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium">{dashboardStats.overdue_breakdown['1-30_days']}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>31-60 days</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-orange-500 rounded-full" 
                            style={{ 
                              width: `${(dashboardStats.overdue_breakdown['31-60_days'] / Math.max(1, dashboardStats.overview.overdue_installments)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium">{dashboardStats.overdue_breakdown['31-60_days']}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>61-90 days</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-red-500 rounded-full" 
                            style={{ 
                              width: `${(dashboardStats.overdue_breakdown['61-90_days'] / Math.max(1, dashboardStats.overview.overdue_installments)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium">{dashboardStats.overdue_breakdown['61-90_days']}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Over 90 days</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-red-800 rounded-full" 
                            style={{ 
                              width: `${(dashboardStats.overdue_breakdown['over_90_days'] / Math.max(1, dashboardStats.overview.overdue_installments)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="font-medium">{dashboardStats.overdue_breakdown['over_90_days']}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Collections */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Collections Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardStats.monthly_collections.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{month.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ 
                                width: `${(month.amount / Math.max(...dashboardStats.monthly_collections.map(m => m.amount), 1)) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="font-medium text-sm">{formatCurrency(month.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Processing Modal */}
      {selectedPolicy && (
        <>
          <PaymentProcessingModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            policy={selectedPolicy}
            installment={selectedInstallment as unknown as Installment}
            onSuccess={(result) => {
              toast({
                title: "Payment Processed",
                description: "Payment has been processed successfully.",
              });
              
              // Refresh data after successful payment
              queryClient.invalidateQueries({ queryKey: ["all-installments"] });
              queryClient.invalidateQueries({ queryKey: ["overdue-installments"] });
              queryClient.invalidateQueries({ queryKey: ["installment-dashboard-stats"] });
              
              setIsPaymentModalOpen(false);
            }}
          />
          
          <PolicyDetailView
            policy={selectedPolicy}
            isOpen={isDetailsDialogOpen}
            onClose={() => setIsDetailsDialogOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default InstallmentDashboard;
