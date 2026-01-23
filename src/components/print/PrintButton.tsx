/**
 * Print Button Component
 * Reusable button for opening print pages
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Printer,
  FileText,
  Phone,
  StickyNote,
  History,
  Users,
  Calendar,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { openCustomerPrintPage, openPolicyPrintPage } from '@/services/printService';

interface PrintButtonProps {
  customerId: number;
  customerName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDropdown?: boolean;
  className?: string;
}

export const PrintButton = ({
  customerId,
  customerName,
  variant = 'outline',
  size = 'sm',
  showDropdown = true,
  className = '',
}: PrintButtonProps) => {
  const handlePrintFull = () => {
    openCustomerPrintPage(customerId, 'full');
  };

  const handlePrintFullV2 = () => {
    openCustomerPrintPage(customerId, 'fullV2');
  };

  const handlePrintSection = (section: 'info' | 'policies' | 'calls' | 'notes' | 'history' | 'appointments' | 'dependents' | 'credentials') => {
    openCustomerPrintPage(customerId, section);
  };

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handlePrintFull}
        className={className}
      >
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Printer className="h-4 w-4 mr-2" />
          Print
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handlePrintFull}>
          <FileText className="h-4 w-4 mr-2" />
          Print Full Report
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handlePrintFullV2}>
          <FileText className="h-4 w-4 mr-2" />
          Print Complete Report (All Policies)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handlePrintSection('info')}>
          <FileText className="h-4 w-4 mr-2" />
          Print Customer Info
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('policies')}>
          <FileText className="h-4 w-4 mr-2" />
          Print Policies
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('calls')}>
          <Phone className="h-4 w-4 mr-2" />
          Print Calls
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('notes')}>
          <StickyNote className="h-4 w-4 mr-2" />
          Print Notes
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('dependents')}>
          <Users className="h-4 w-4 mr-2" />
          Print Dependents
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('appointments')}>
          <Calendar className="h-4 w-4 mr-2" />
          Print Appointments
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('history')}>
          <History className="h-4 w-4 mr-2" />
          Print History
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePrintSection('credentials')}>
          <Shield className="h-4 w-4 mr-2" />
          Print Credentials
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Simple print button for individual tabs
 */
interface TabPrintButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const TabPrintButton = ({
  onClick,
  label = 'Print',
  variant = 'outline',
  size = 'sm',
  className = '',
}: TabPrintButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

/**
 * Policy print button
 */
interface PolicyPrintButtonProps {
  policyId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PolicyPrintButton = ({
  policyId,
  variant = 'outline',
  size = 'sm',
  className = '',
}: PolicyPrintButtonProps) => {
  const handlePrint = () => {
    openPolicyPrintPage(policyId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
};

export default PrintButton;
