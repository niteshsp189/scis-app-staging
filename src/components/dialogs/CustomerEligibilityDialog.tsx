
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, UserCheck } from "lucide-react";
import { CustomerData } from "@/types/customer";
import { checkPolicyEligibility, getEligiblePolicies, POLICY_RESTRICTIONS } from "@/services/policyEligibilityService";

interface CustomerEligibilityDialogProps {
  customer: CustomerData;
}

export const CustomerEligibilityDialog = ({ customer }: CustomerEligibilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [customerAge, setCustomerAge] = useState("");
  const [income, setIncome] = useState("");
  const [employment, setEmployment] = useState("");
  const [state, setState] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");

  const eligiblePolicies = getEligiblePolicies(
    customer,
    customerAge ? parseInt(customerAge) : undefined,
    income ? parseInt(income) : undefined,
    employment,
    state
  );

  const selectedPolicyEligibility = selectedPolicy 
    ? checkPolicyEligibility(
        selectedPolicy, 
        customer, 
        customerAge ? parseInt(customerAge) : undefined,
        income ? parseInt(income) : undefined,
        employment,
        state
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Check Eligibility
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Policy Eligibility Check - {customer.name}
          </DialogTitle>
          <DialogDescription>
            Check which insurance policies this customer is eligible for based on their profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={customerAge}
                  onChange={(e) => setCustomerAge(e.target.value)}
                  placeholder="Enter customer age"
                />
              </div>
              <div>
                <Label htmlFor="income">Annual Income</Label>
                <Input
                  id="income"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="Enter annual income"
                />
              </div>
              <div>
                <Label htmlFor="employment">Employment Status</Label>
                <Select value={employment} onValueChange={setEmployment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter state (e.g., CA, NY)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Eligible Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Eligible Policies ({eligiblePolicies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {eligiblePolicies.map((policy) => (
                  <Badge key={policy} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    {policy}
                  </Badge>
                ))}
              </div>
              {eligiblePolicies.length === 0 && (
                <p className="text-gray-500">No policies available with current information. Please update customer details.</p>
              )}
            </CardContent>
          </Card>

          {/* Policy Specific Check */}
          <Card>
            <CardHeader>
              <CardTitle>Check Specific Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="policySelect">Select Policy Type</Label>
                <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a policy to check" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_RESTRICTIONS.map((restriction) => (
                      <SelectItem key={restriction.policyType} value={restriction.policyType}>
                        {restriction.policyType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPolicyEligibility && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {selectedPolicyEligibility.eligible ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      selectedPolicyEligibility.eligible ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedPolicyEligibility.eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>

                  {selectedPolicyEligibility.reasons.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Restrictions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPolicyEligibility.reasons.map((reason, index) => (
                          <li key={index} className="text-sm text-red-600">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedPolicyEligibility.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Additional Requirements:
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPolicyEligibility.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-600">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
