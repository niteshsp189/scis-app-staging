import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PolicyService } from '@/services/policyService';
import { DataTable } from './DataTable';
import { createColumns } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface PolicyGridProps {
  onViewDetails: (policyId: number) => void;
  onReinstate: (policyId: number) => void;
  onProcessPayment: (policyId: number) => void;
  onAmend: (policyId: number) => void;
  onCancel: (policyId: number) => void;
  onRenew: (policyId: number) => void;
  onSendReminder: (policyId: number) => void;
}

export const PolicyGrid: React.FC<PolicyGridProps> = ({
  onViewDetails,
  onReinstate,
  onProcessPayment,
  onAmend,
  onCancel,
  onRenew,
  onSendReminder,
}) => {
  const {
    data: policiesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['policies-grid'],
    queryFn: () => PolicyService.getPolicies(1, 100, {}, { field: 'id' as any, direction: 'desc' }), // Fetch more for grid, sorted by latest first
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading policies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load policies: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const policies = policiesResponse?.data || [];
  const columns = createColumns({
    onViewDetails,
    onReinstate,
    onProcessPayment,
    onAmend,
    onCancel,
    onRenew,
    onSendReminder,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle></CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={policies} />
      </CardContent>
    </Card>
  );
};
