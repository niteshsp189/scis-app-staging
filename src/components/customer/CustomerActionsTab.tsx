
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";
import { CustomerNotesDialog } from "../dialogs/CustomerNotesDialog";
import { PrintCustomerDetails } from "../PrintCustomerDetails";
import { CustomerNote, FamilyMember } from "@/types/customer";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  joinDate: string;
  status: string;
  totalPolicies: number;
  totalPremium: number;
  lastContact: string;
  policies: string[];
  nextRenewal: string;
  relationship: string;
  familyId: string;
  dependents: Array<{
    name: string;
    relationship: string;
    policies: string[];
  }>;
  groupPolicy: string | null;
  familyMembers?: FamilyMember[];
  customerType?: string;
  notes: CustomerNote[];
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: string;
    category: string;
    uploadedBy: string;
  }>;
}

interface CustomerActionsTabProps {
  customer: Customer;
  onUpdateNotes: (notes: CustomerNote[]) => void;
}

export const CustomerActionsTab = ({ customer, onUpdateNotes }: CustomerActionsTabProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Button variant="outline" className="flex items-center gap-2 h-12">
        <Phone className="h-4 w-4" />
        Call Customer
      </Button>
      <Button variant="outline" className="flex items-center gap-2 h-12">
        <Mail className="h-4 w-4" />
        Send Email
      </Button>
      <CustomerNotesDialog
        customerId={customer.id}
        customerName={customer.name}
        notes={customer.notes}
        onUpdateNotes={onUpdateNotes}
      />
      <PrintCustomerDetails customer={customer} />
    </div>
  );
};
