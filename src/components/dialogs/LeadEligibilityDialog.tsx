
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, UserCheck } from "lucide-react";
import { PolicyCheckCard } from "./lead-eligibility/PolicyCheckCard";
import { LeadDetailsForm } from "./lead-eligibility/LeadDetailsForm";
import { EligiblePoliciesCard } from "./lead-eligibility/EligiblePoliciesCard";
import { CustomerData } from "@/types/customer";
import { checkPolicyEligibility } from "@/services/policyEligibilityService";

interface LeadEligibilityDialogProps {
  onConvertToCustomer: (customer: CustomerData) => void;
}

export function LeadEligibilityDialog({ onConvertToCustomer }: LeadEligibilityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leadAge, setLeadAge] = useState("");
  const [income, setIncome] = useState("");
  const [employment, setEmployment] = useState("");
  const [state, setState] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'leadAge':
        setLeadAge(value);
        break;
      case 'income':
        setIncome(value);
        break;
      case 'employment':
        setEmployment(value);
        break;
      case 'state':
        setState(value);
        break;
    }
  };

  const mockCustomer: CustomerData = {
    id: Date.now(),
    firstName: "Lead",
    lastName: "Prospect",
    name: "Lead Prospect",
    email: "lead@example.com",
    phone: "",
    cellPhone: "",
    homePhone: "",
    workPhone: "",
    fax: "",
    company: "",
    location: state,
    city: "",
    state: state,
    zipCode: "",
    address: "",
    apartment: "",
    apartmentType: "",
    gender: "",
    dateOfBirth: "",
    ssn: "",
    maritalStatus: "",
    height: "",
    weight: "",
    smoker: "",
    differentMailingAddress: false,
    mailingAddress: "",
    mailingApartment: "",
    mailingApartmentType: "",
    mailingCity: "",
    mailingState: "",
    mailingZipCode: "",
    referral: "",
    status: "Active",
    joinDate: new Date().toISOString().split('T')[0],
    totalPolicies: 0,
    totalPremium: 0,
    lastContact: new Date().toISOString().split('T')[0],
    policies: [],
    nextRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    relationship: "Primary",
    familyId: `FAM-${String(Date.now()).slice(-3)}`,
    dependents: [],
    groupPolicy: null,
    customerType: "client",
    familyMembers: [],
    notes: [],
    documents: []
  };

  const handleConvertToCustomer = () => {
    onConvertToCustomer(mockCustomer);
    setIsOpen(false);
  };

  const isEligible = leadAge !== "" && parseInt(leadAge) > 18;

  // Get eligibility result for selected policy
  const eligibilityResult = selectedPolicy ? checkPolicyEligibility(
    selectedPolicy, 
    mockCustomer,
    leadAge ? parseInt(leadAge) : undefined,
    income ? parseInt(income) : undefined,
    employment,
    state
  ) : null;

  // Get eligible policies based on current lead data
  const getEligiblePolicies = () => {
    if (!leadAge || parseInt(leadAge) <= 18) return [];
    
    const policies = ["Life Insurance", "Health Insurance", "Auto Insurance"];
    return policies.filter(policy => {
      const result = checkPolicyEligibility(
        policy, 
        mockCustomer,
        parseInt(leadAge),
        income ? parseInt(income) : undefined,
        employment,
        state
      );
      return result.eligible;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Check Policy Eligibility</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Lead Policy Eligibility</DialogTitle>
          <DialogDescription>
            Fill out the lead details to check policy eligibility.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LeadDetailsForm
            leadAge={leadAge}
            income={income}
            employment={employment}
            state={state}
            onFieldChange={handleFieldChange}
          />

          <div>
            <PolicyCheckCard
              selectedPolicy={selectedPolicy}
              onPolicyChange={setSelectedPolicy}
              eligibilityResult={eligibilityResult}
            />
            {isEligible && (
              <EligiblePoliciesCard eligiblePolicies={getEligiblePolicies()} />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConvertToCustomer}
            disabled={!isEligible}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Convert to Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
