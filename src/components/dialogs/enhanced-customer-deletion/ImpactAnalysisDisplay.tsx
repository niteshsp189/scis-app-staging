import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  User,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import type { 
  DeletionImpactAnalysis, 
  PolicySummary,
  DependentImpact 
} from '@/types/customerDeletion';
import { CustomerDeletionService } from '@/services/customerDeletionService';

interface ImpactAnalysisDisplayProps {
  analysis: DeletionImpactAnalysis;
  onProceed: (reason?: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ImpactAnalysisDisplay = ({ 
  analysis, 
  onProceed, 
  onCancel, 
  isProcessing = false 
}: ImpactAnalysisDisplayProps) => {
  const [userAcknowledged, setUserAcknowledged] = useState(false);
  const [impactReviewed, setImpactReviewed] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const canProceed = userAcknowledged && impactReviewed;

  const handleProceed = () => {
    if (canProceed) {
      onProceed(deletionReason.trim() || undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Level Alert */}
      <Alert className={`border-2 ${CustomerDeletionService.getRiskLevelColor(analysis.risk_level)}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {CustomerDeletionService.getRiskLevelIcon(analysis.risk_level)} 
          {analysis.risk_level.toUpperCase()} IMPACT DELETION
        </AlertTitle>
        <AlertDescription>
          This deletion will affect multiple areas of the system. Please review all impacts before proceeding.
        </AlertDescription>
      </Alert>

      {/* Main Impact Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="policies" className="text-xs">
            Policies ({analysis.policies_impact.total_policies})
          </TabsTrigger>
          <TabsTrigger value="dependents" className="text-xs">
            Dependents ({analysis.dependents_impact.total_dependents})
          </TabsTrigger>
          <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab analysis={analysis} />
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <PoliciesTab policies={analysis.policies_impact} />
        </TabsContent>

        <TabsContent value="dependents" className="space-y-4">
          <DependentsTab 
            dependents={analysis.dependents_impact}
            relationships={analysis.relationships_impact}
          />
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <RelatedRecordsTab records={analysis.related_records} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialTab financial={analysis.financial_impact} />
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Deletion Reason */}
      <div className="space-y-2">
        <Label htmlFor="deletion-reason">Deletion Reason (Optional)</Label>
        <Textarea
          id="deletion-reason"
          placeholder="Enter reason for deletion (optional)..."
          value={deletionReason}
          onChange={(e) => setDeletionReason(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* User Acknowledgments */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm">Required Acknowledgments</h4>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="impact-reviewed"
            checked={impactReviewed}
            onCheckedChange={(checked) => setImpactReviewed(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label 
              htmlFor="impact-reviewed" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have reviewed all impacts listed above
            </Label>
            <p className="text-xs text-muted-foreground">
              Confirm that you have reviewed all policies, dependents, and related records that will be affected.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox 
            id="user-acknowledged"
            checked={userAcknowledged}
            onCheckedChange={(checked) => setUserAcknowledged(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label 
              htmlFor="user-acknowledged" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this action cannot be undone easily
            </Label>
           
            <p className="text-xs text-muted-foreground">
              While records can be restored but 
              this process requires administrator intervention.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleProceed} 
          disabled={!canProceed || isProcessing}
          className="min-w-[140px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete Customer'
          )}
        </Button>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ analysis }: { analysis: DeletionImpactAnalysis }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <h4 className="font-medium">Customer Information</h4>
        <div className="text-sm text-muted-foreground">
          <div><strong>Name:</strong> {analysis.customer_name}</div>
          <div><strong>Role:</strong> {analysis.customer_role.replace('_', ' ').toUpperCase()}</div>
          <div><strong>Risk Level:</strong> 
            <Badge className={`ml-2 ${CustomerDeletionService.getRiskLevelColor(analysis.risk_level)}`}>
              {analysis.risk_level.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Quick Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Policies: {analysis.policies_impact.total_policies}</div>
          <div>Dependents: {analysis.dependents_impact.total_dependents}</div>
          <div>Appointments: {analysis.related_records.appointments.total}</div>
          <div>Documents: {analysis.related_records.documents}</div>
        </div>
      </div>
    </div>

    <Separator />

    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        Warnings
      </h4>
      {analysis.deletion_summary.warnings.length > 0 ? (
        <ul className="space-y-2">
          {analysis.deletion_summary.warnings.map((warning, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-yellow-500 mt-0.5">•</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-green-600">No major warnings for this deletion.</p>
      )}
    </div>

    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-blue-500" />
        Actions That Will Be Taken
      </h4>
      <ul className="space-y-2">
        {analysis.deletion_summary.actions.map((action, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// Policies Tab Component
const PoliciesTab = ({ policies }: { policies: any }) => (
  <ScrollArea className="h-[400px]">
    <div className="space-y-4">
      {policies.active.length > 0 && (
        <PolicySection title="Active Policies" policies={policies.active} variant="destructive" />
      )}
      
      {policies.suspended.length > 0 && (
        <PolicySection title="Suspended Policies" policies={policies.suspended} variant="warning" />
      )}
      
      {policies.cancelled.length > 0 && (
        <PolicySection title="Cancelled Policies" policies={policies.cancelled} variant="secondary" />
      )}
      
      {policies.total_policies === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No policies found for this customer.</p>
        </div>
      )}
    </div>
  </ScrollArea>
);

const PolicySection = ({ title, policies, variant }: {
  title: string;
  policies: PolicySummary[];
  variant: 'destructive' | 'warning' | 'secondary';
}) => (
  <div className="space-y-2">
    <h4 className="font-medium">{title} ({policies.length})</h4>
    <div className="space-y-2">
      {policies.map((policy) => (
        <div key={policy.id} className="p-3 border rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{policy.policy_number}</div>
              <div className="text-sm text-muted-foreground">{policy.plan_name}</div>
              <div className="text-sm">
                Premium: {CustomerDeletionService.formatPremium(policy.premium_amount)}
                {policy.outstanding_amount > 0 && (
                  <span className="text-red-600 ml-2">
                    (Outstanding: {CustomerDeletionService.formatPremium(policy.outstanding_amount)})
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-sm">
              <Badge variant={variant === 'destructive' ? 'destructive' : 'outline'}>
                {policy.status}
              </Badge>
              {policy.has_dependents && (
                <div className="text-xs text-muted-foreground mt-1">
                  {policy.dependent_count} dependents
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Dependents Tab Component
const DependentsTab = ({ dependents, relationships }: { 
  dependents: any;
  relationships: any;
}) => (
  <ScrollArea className="h-[400px]">
    <div className="space-y-6">
      {/* Dependents Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Dependents ({dependents.total_dependents})
        </h4>
        
        {dependents.dependents.length > 0 ? (
          <div className="space-y-3">
            {dependents.dependents.map((dependent: DependentImpact) => (
              <div key={dependent.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{dependent.name}</div>
                    <div className="text-sm text-muted-foreground">{dependent.relationship}</div>
                    <div className="text-sm mt-1">
                      Policies with customer: {dependent.policies_with_customer}
                      {dependent.other_policies_count > 0 && (
                        <span className="text-blue-600 ml-2">
                          Other policies: {dependent.other_policies_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={CustomerDeletionService.getDependentImpactColor(dependent.impact)}>
                    {dependent.impact === 'will_be_deleted' ? 'Will be deleted' : 'Will be kept'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {dependent.message}
                </div>
                {dependent.other_policies.length > 0 && (
                  <div className="mt-2 text-xs">
                    <strong>Other policies:</strong>
                    {dependent.other_policies.map((policy, idx) => (
                      <div key={idx} className="ml-2">
                        • {policy.policy_number} ({policy.plan_name}) - {policy.main_holder}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No dependents found.
          </div>
        )}
      </div>

      {/* Relationships Section */}
      {relationships.total_relationships > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Customer Relationships ({relationships.total_relationships})
          </h4>
          <div className="space-y-2">
            {relationships.relationships.map((relationship: any) => (
              <div key={relationship.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{relationship.related_customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {relationship.relationship_type} 
                      <span className="ml-2 text-xs">
                        ({relationship.direction})
                      </span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Will be removed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </ScrollArea>
);

// Related Records Tab Component
const RelatedRecordsTab = ({ records }: { records: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" />
          <h4 className="font-medium">Appointments</h4>
        </div>
        <div className="space-y-1 text-sm">
          <div>Total: {records.appointments.total}</div>
          <div className="text-orange-600">Upcoming: {records.appointments.upcoming}</div>
          <div className="text-green-600">Completed: {records.appointments.completed}</div>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4" />
          <h4 className="font-medium">Reminders</h4>
        </div>
        <div className="space-y-1 text-sm">
          <div>Total: {records.reminders.total}</div>
          <div className="text-blue-600">Pending: {records.reminders.pending}</div>
          <div className="text-red-600">Overdue: {records.reminders.overdue}</div>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <h4 className="font-medium">Documents</h4>
        </div>
        <div className="text-sm">
          Total: {records.documents}
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4" />
          <h4 className="font-medium">Notes</h4>
        </div>
        <div className="text-sm">
          Total: {records.notes}
        </div>
      </div>
    </div>

    <Alert>
      <Shield className="h-4 w-4" />
      <AlertTitle>Data Preservation</AlertTitle>
      <AlertDescription>
        All records will be soft deleted and can be restored by administrators within 90 days.
      </AlertDescription>
    </Alert>
  </div>
);

// Financial Tab Component
const FinancialTab = ({ financial }: { financial: any }) => (
  <div className="space-y-6">
    <div className="grid gap-4">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4" />
          <h4 className="font-medium">Financial Summary</h4>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Total Annual Premium:</span>
            <span className="font-medium">
              {CustomerDeletionService.formatPremium(financial.total_annual_premium)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Outstanding Premiums:</span>
            <span className={`font-medium ${financial.outstanding_premiums > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {CustomerDeletionService.formatPremium(financial.outstanding_premiums)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Credit Balance:</span>
            <span className={`font-medium ${financial.credit_balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {CustomerDeletionService.formatPremium(financial.credit_balance)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg">
            <span className="font-medium">Net Amount:</span>
            <span className={`font-bold ${financial.net_amount > 0 ? 'text-red-600' : financial.net_amount < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {CustomerDeletionService.formatPremium(financial.net_amount)}
            </span>
          </div>
        </div>
      </div>
    </div>

    {financial.outstanding_premiums > 0 && (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Outstanding Balance Warning</AlertTitle>
        <AlertDescription>
          This customer has outstanding premiums. Consider collecting payment or 
          documenting the reason for deletion before proceeding.
        </AlertDescription>
      </Alert>
    )}

    {financial.credit_balance > 0 && (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Credit Balance Notice</AlertTitle>
        <AlertDescription>
          This customer has a credit balance that may need to be refunded. 
          Please ensure proper financial procedures are followed.
        </AlertDescription>
      </Alert>
    )}
  </div>
);