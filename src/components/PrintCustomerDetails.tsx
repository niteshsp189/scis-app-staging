import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { PolicyDetailsSection } from "./print/PolicyDetailsSection";
import { FamilyProfileSection } from "./print/FamilyProfileSection";
import { ActivityLogsSection } from "./print/ActivityLogsSection";
import { CustomerNotesSection } from "./print/CustomerNotesSection";
import { DocumentsSection } from "./print/DocumentsSection";
import { fieldChangeTracker } from "@/utils/fieldChangeTracker";
import { FamilyMember } from "@/types/customer";

import { CustomerData } from "@/types/customer";

interface PrintCustomerDetailsProps {
  customer: CustomerData;
}

export function PrintCustomerDetails({ customer }: PrintCustomerDetailsProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const changes = fieldChangeTracker.getChanges();
    const changesSection =
      changes.length > 0
        ? `
      <div class="section">
        <h3>Field Changes</h3>
        <div class="changes-list">
          ${changes.map((change) => fieldChangeTracker.formatChangeForPrint(change)).join("")}
        </div>
      </div>
    `
        : "";

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Details - ${customer.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; }
            .full-width { grid-column: span 2; }
            .policy-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; background-color: #f9f9f9; }
            .family-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; background-color: #f5f5f5; }
            .log-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; background-color: #f8f8f8; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; }
            .badge-green { background-color: #dcfce7; color: #166534; }
            .badge-blue { background-color: #dbeafe; color: #1e40af; }
            .badge-yellow { background-color: #fef3c7; color: #92400e; }
            .badge-red { background-color: #fee2e2; color: #991b1b; }
            .badge-purple { background-color: #e9d5ff; color: #7c3aed; }
            .note { padding: 10px; margin: 5px 0; border-left: 4px solid #ccc; background-color: #f9f9f9; }
            .note-red { border-left-color: #ef4444; }
            .note-yellow { border-left-color: #eab308; }
            .note-green { border-left-color: #22c55e; }
            .note-blue { border-left-color: #3b82f6; }
            .note-purple { border-left-color: #a855f7; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .detail-label { font-weight: bold; }
            .changes-list { margin-top: 15px; }
            .change-item {
              border: 1px solid #e0e0e0;
              padding: 12px;
              margin-bottom: 12px;
              border-radius: 5px;
              background-color: #fafafa;
            }
            .initial-value {
              color: #dc2626;
              font-style: italic;
            }
            .updated-value {
              color: #16a34a;
              font-weight: 500;
            }
            .change-meta {
              color: #6b7280;
              font-size: 11px;
            }
            @media print {
              body { margin: 0; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Complete Customer Profile Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Customer ID: ${customer.id} | Family ID: ${customer.familyId}</p>
            ${changes.length > 0 ? `<p><strong>Note:</strong> This report includes ${changes.length} field change(s) from initial values.</p>` : ""}
          </div>

          <div class="section">
            <h2>${customer.name} - Primary Customer</h2>
            <div class="grid">
              <div><strong>Email:</strong> ${customer.email}</div>
              <div><strong>Phone:</strong> ${customer.phone}</div>
              <div><strong>Company:</strong> ${customer.company}</div>
              <div><strong>Location:</strong> ${customer.location}</div>
              <div><strong>Customer Type:</strong> ${customer.customerType || "Client"}</div>
              <div><strong>Status:</strong> ${customer.status}</div>
              <div><strong>Customer Since:</strong> ${new Date(customer.joinDate).toLocaleDateString()}</div>
              <div><strong>Last Contact:</strong> ${new Date(customer.lastContact).toLocaleDateString()}</div>
              <div><strong>Total Policies:</strong> ${customer.totalPolicies}</div>
              <div><strong>Annual Premium:</strong> $${customer.totalPremium.toLocaleString()}</div>
            </div>
          </div>

          ${changesSection}

          ${PolicyDetailsSection({ policies: customer.policies, nextRenewal: customer.nextRenewal })}

          ${FamilyProfileSection({ familyMembers: customer.familyMembers, dependents: customer.dependents })}

          ${DocumentsSection({ documents: customer.documents })}

          ${CustomerNotesSection({ notes: customer.notes })}

          ${ActivityLogsSection()}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #666;">
            <p>End of Customer Profile Report</p>
            <p>Report generated by Insurance CRM System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="h-3 w-3 mr-1" />
      Print
    </Button>
  );
}
