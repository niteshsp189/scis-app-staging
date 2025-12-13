import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Loader2, User, Trash2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { CustomerDeletionService } from '@/services/customerDeletionService';
import { ImpactAnalysisDisplay } from './ImpactAnalysisDisplay';
import type { CustomerData } from '@/types/customer';
import type { DeletionRequest } from '@/types/customerDeletion';

type DeletionStep = 'confirm' | 'analyzing' | 'review' | 'deleting' | 'success' | 'error';

interface EnhancedCustomerDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData;
  onDeleteSuccess?: () => void;
}

export const EnhancedCustomerDeletionDialog = ({
  open,
  onOpenChange,
  customer,
  onDeleteSuccess
}: EnhancedCustomerDeletionDialogProps) => {
  const [currentStep, setCurrentStep] = useState<DeletionStep>('confirm');
  const [error, setError] = useState<string | null>(null);

  // Impact analysis query
  const {
    data: impactAnalysis,
    error: analysisError,
    isLoading: isAnalyzing,
    refetch: analyzeImpact
  } = useQuery({
    queryKey: ['customer-deletion-impact', customer.id],
    queryFn: () => CustomerDeletionService.analyzeDeletionImpact(customer.id),
    enabled: false, // Only run when explicitly triggered
    retry: 1,
  });

  // Handle analysis success/error
  const handleAnalysisComplete = async () => {
    try {
      const result = await analyzeImpact();
      if (result.data) {
        setCurrentStep('review');
      }
    } catch (error: any) {
      setError(error.message);
      setCurrentStep('error');
    }
  };

  // Deletion mutation
  const deleteMutation = useMutation({
    mutationFn: (request: DeletionRequest) => 
      CustomerDeletionService.executeEnhancedDeletion(customer.id, request),
    onSuccess: (result) => {
      setCurrentStep('success');
      toast({
        title: "Customer Deleted Successfully",
        description: `${customer.name} and ${result.total_records_deleted} related records have been deleted.`,
      });
      if (onDeleteSuccess) {
        setTimeout(onDeleteSuccess, 5000); // Give user time to see success message
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      setCurrentStep('error');
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleStartAnalysis = async () => {
    setCurrentStep('analyzing');
    setError(null);
    await handleAnalysisComplete();
  };

  const handleProceedWithDeletion = (reason?: string) => {
    setCurrentStep('deleting');
    
    const request: DeletionRequest = {
      deletion_reason: reason,
      user_acknowledged: true,
      impact_reviewed: true
    };
    
    deleteMutation.mutate(request);
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setCurrentStep('confirm');
      setError(null);
    }, 300);
  };

  const getStepProgress = (): number => {
    switch (currentStep) {
      case 'confirm': return 0;
      case 'analyzing': return 25;
      case 'review': return 50;
      case 'deleting': return 75;
      case 'success': return 100;
      case 'error': return 50;
      default: return 0;
    }
  };

  const getDialogTitle = (): string => {
    switch (currentStep) {
      case 'confirm': return 'Delete Customer';
      case 'analyzing': return 'Analyzing Impact';
      case 'review': return 'Review Deletion Impact';
      case 'deleting': return 'Deleting Customer';
      case 'success': return 'Deletion Complete';
      case 'error': return 'Deletion Error';
      default: return 'Delete Customer';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'confirm' && 'This will permanently delete the customer and all related data.'}
            {currentStep === 'analyzing' && 'Analyzing the impact of deleting this customer...'}
            {currentStep === 'review' && 'Review the impact before proceeding with deletion.'}
            {currentStep === 'deleting' && 'Deleting customer and related records...'}
            {currentStep === 'success' && 'Customer has been successfully deleted.'}
            {currentStep === 'error' && 'An error occurred during the deletion process.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{getStepProgress()}%</span>
          </div>
          <Progress value={getStepProgress()} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {currentStep === 'confirm' && (
            <InitialConfirmationStep
              customer={customer}
              onProceed={handleStartAnalysis}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 'analyzing' && (
            <AnalyzingStep />
          )}

          {currentStep === 'review' && impactAnalysis && (
            <ImpactAnalysisDisplay
              analysis={impactAnalysis}
              onProceed={handleProceedWithDeletion}
              onCancel={handleCancel}
            />
          )}

          {currentStep === 'deleting' && (
            <DeletingStep />
          )}

          {currentStep === 'success' && (
            <SuccessStep
              customer={customer}
              onClose={() => onOpenChange(false)}
            />
          )}

          {currentStep === 'error' && (
            <ErrorStep
              error={error || 'An unknown error occurred'}
              onRetry={handleStartAnalysis}
              onCancel={handleCancel}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Individual Step Components
const InitialConfirmationStep = ({ 
  customer, 
  onProceed, 
  onCancel 
}: { 
  customer: CustomerData;
  onProceed: () => void;
  onCancel: () => void;
}) => (
  <div className="space-y-6">
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Confirm Customer Deletion</AlertTitle>
      <AlertDescription>
        You are about to delete <strong>{customer.name}</strong> and all related data. 
        This action requires careful review of the impact before proceeding.
      </AlertDescription>
    </Alert>

    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
          {customer.phone && (
            <div className="text-sm text-muted-foreground">{customer.phone}</div>
          )}
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-yellow-800 mb-1">What happens next?</div>
          <ul className="space-y-1 text-yellow-700">
            <li>• System will analyze all data connected to this customer</li>
            <li>• You'll review the impact on policies, dependents, and records</li>
            <li>• You'll confirm your understanding before deletion</li>
          
            <li>• All data will be soft deleted and can recoverable but require administrator intervention</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onProceed}>
        Analyze Impact
      </Button>
    </div>
  </div>
);

const AnalyzingStep = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    <div className="text-center">
      <h3 className="font-medium">Analyzing Impact</h3>
      <p className="text-sm text-muted-foreground">
        Please wait while we analyze all related data...
      </p>
    </div>
  </div>
);

const DeletingStep = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
    <div className="text-center">
      <h3 className="font-medium">Deleting Customer</h3>
      <p className="text-sm text-muted-foreground">
        Please wait while we delete the customer and all related records...
      </p>
    </div>
  </div>
);

const SuccessStep = ({ 
  customer, 
  onClose 
}: { 
  customer: CustomerData;
  onClose: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-6">
    <CheckCircle className="h-12 w-12 text-green-600" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-medium">Customer Deleted Successfully</h3>
      <p className="text-sm text-muted-foreground">
        <strong>{customer.name}</strong> and all related records have been deleted.
      </p>
    </div>
    <Alert>
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Data Recovery Available</AlertTitle>
      <AlertDescription>
        All deleted data can be restored by system administrators but required manual intervention when needed.
      </AlertDescription>
    </Alert>
    <Button onClick={onClose} className="w-full">
      Close
    </Button>
  </div>
);

const ErrorStep = ({ 
  error, 
  onRetry, 
  onCancel 
}: { 
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}) => (
  <div className="space-y-6">
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Deletion Failed</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onRetry}>
        Try Again
      </Button>
    </div>
  </div>
);