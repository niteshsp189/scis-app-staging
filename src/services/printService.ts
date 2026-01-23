/**
 * Print Service
 * Handles opening print pages in new tabs and print/PDF functionality
 */

export interface PrintPageOptions {
  title?: string;
  subtitle?: string;
  showPrintDialog?: boolean;
  closeAfterPrint?: boolean;
}

/**
 * Open a print page in a new browser tab
 */
export const openPrintPage = (url: string, options?: PrintPageOptions): Window | null => {
  const printWindow = window.open(url, '_blank');
  
  if (printWindow && options?.showPrintDialog) {
    // Wait for the page to load before triggering print
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
        if (options?.closeAfterPrint) {
          printWindow.close();
        }
      }, 500);
    });
  }
  
  return printWindow;
};

/**
 * Build a print page URL
 */
export const buildPrintUrl = (
  baseUrl: string,
  params?: Record<string, string | number | boolean>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return `${baseUrl}?${searchParams.toString()}`;
};

/**
 * Customer print page URLs
 */
export const CustomerPrintUrls = {
  full: (customerId: number) => `/customers/${customerId}/print`,
  fullV2: (customerId: number) => `/customers/${customerId}/print?allPolicies=true`,
  info: (customerId: number) => `/customers/${customerId}/print?sections=info`,
  policies: (customerId: number) => `/customers/${customerId}/print/policies`,
  calls: (customerId: number) => `/customers/${customerId}/print/calls`,
  notes: (customerId: number) => `/customers/${customerId}/print/notes`,
  history: (customerId: number) => `/customers/${customerId}/print/history`,
  appointments: (customerId: number) => `/customers/${customerId}/print?sections=appointments`,
  dependents: (customerId: number) => `/customers/${customerId}/print?sections=dependents`,
  credentials: (customerId: number) => `/customers/${customerId}/print?sections=credentials`,
};

/**
 * Policy print page URLs
 */
export const PolicyPrintUrls = {
  detail: (policyId: number) => `/policies/${policyId}/print`,
};

/**
 * Open customer full print page
 */
export const openCustomerPrintPage = (
  customerId: number,
  section?: 'full' | 'fullV2' | 'info' | 'policies' | 'calls' | 'notes' | 'history' | 'appointments' | 'dependents' | 'credentials'
): Window | null => {
  const urlFn = CustomerPrintUrls[section || 'full'];
  return openPrintPage(urlFn(customerId));
};

/**
 * Open policy print page
 */
export const openPolicyPrintPage = (policyId: number): Window | null => {
  return openPrintPage(PolicyPrintUrls.detail(policyId));
};

/**
 * Trigger browser print dialog
 */
export const triggerPrint = (): void => {
  window.print();
};

/**
 * Download as PDF using browser's print-to-PDF
 * Note: This opens the print dialog where user can select "Save as PDF"
 */
export const downloadAsPdf = (): void => {
  // Browser's native print dialog allows saving as PDF
  window.print();
};

/**
 * Print styles that should be injected into print pages
 */
export const PRINT_STYLES = `
  /* Print-specific styles */
  @media print {
    /* Hide non-printable elements */
    .no-print,
    .print-actions,
    .print-toolbar {
      display: none !important;
    }

    /* Page settings */
    @page {
      size: A4;
      margin: 0.75cm;
    }

    /* Ensure page breaks are respected */
    .page-break {
      page-break-before: always;
    }

    .page-break-after {
      page-break-after: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* Ensure colors print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Base typography */
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      background: white;
    }

    /* Links should be black in print */
    a {
      color: #000 !important;
      text-decoration: none !important;
    }
  }

  /* Screen styles for print preview */
  @media screen {
    .print-page {
      background: #f9fafb;
      min-height: 100vh;
      padding: 0;
    }

    .print-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      box-shadow: none;
      padding: 30px 50px;
    }
  }
`;

/**
 * Common print CSS classes
 */
export const PRINT_CSS = `
  /* Base styles */
  .print-header {
    border-bottom: 2px solid #1e40af;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }

  .print-header-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .print-header-logo img {
    height: 40px;
    width: auto;
  }

  .print-header-title {
    font-size: 24px;
    font-weight: bold;
    color: #1e40af;
    margin: 0;
  }

  .print-header-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 5px 0 0 0;
  }

  .print-header-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #6b7280;
    margin-top: 10px;
  }

  /* Section styles */
  .print-section {
    margin-bottom: 25px;
    page-break-inside: avoid;
  }

  .print-section-title {
    font-size: 14px;
    font-weight: bold;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Grid layouts */
  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .print-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .print-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .print-full-width {
    grid-column: 1 / -1;
  }

  /* Info rows */
  .print-info-row {
    display: flex;
    margin-bottom: 6px;
    font-size: 11px;
  }

  .print-info-label {
    font-weight: bold;
    color: #374151;
    min-width: 120px;
    flex-shrink: 0;
  }

  .print-info-value {
    color: #1f2937;
  }

  .print-info-value.highlight {
    color: #dc2626;
    font-weight: 500;
  }

  /* Policy cards */
  .print-policy-card {
    border: 1px solid #d1d5db;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 4px;
    background-color: #f9fafb;
    page-break-inside: avoid;
  }

  .print-policy-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .print-policy-company {
    font-weight: bold;
    font-size: 12px;
    color: #1e40af;
  }

  .print-policy-eff {
    font-size: 11px;
    color: #059669;
    font-weight: 500;
  }

  .print-policy-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    font-size: 10px;
  }

  /* Notes */
  .print-note {
    padding: 10px;
    margin-bottom: 10px;
    border-left: 4px solid #9ca3af;
    background-color: #f9fafb;
    page-break-inside: avoid;
  }

  .print-note-header {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #6b7280;
    margin-bottom: 6px;
  }

  .print-note-author {
    font-weight: bold;
  }

  .print-note-content {
    font-size: 11px;
    color: #1f2937;
  }

  /* Note colors */
  .note-black { border-left-color: #374151; }
  .note-red { border-left-color: #dc2626; background-color: #fef2f2; }
  .note-blue { border-left-color: #2563eb; background-color: #eff6ff; }
  .note-purple { border-left-color: #7c3aed; background-color: #f5f3ff; }
  .note-green { border-left-color: #16a34a; background-color: #f0fdf4; }
  .note-orange { border-left-color: #ea580c; background-color: #fff7ed; }
  .note-yellow { border-left-color: #ca8a04; background-color: #fefce8; }
  .note-pink { border-left-color: #db2777; background-color: #fdf2f8; }
  .note-brown { border-left-color: #92400e; background-color: #fffbeb; }

  /* Tables */
  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    margin-bottom: 15px;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #d1d5db;
    padding: 6px 8px;
    text-align: left;
  }

  .print-table th {
    background-color: #f3f4f6;
    font-weight: bold;
    color: #374151;
  }

  .print-table tr:nth-child(even) {
    background-color: #f9fafb;
  }

  /* Badges */
  .print-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 500;
  }

  .badge-green {
    background-color: #dcfce7;
    color: #166534;
  }

  .badge-blue {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .badge-yellow {
    background-color: #fef3c7;
    color: #92400e;
  }

  .badge-red {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .badge-gray {
    background-color: #f3f4f6;
    color: #374151;
  }

  .badge-purple {
    background-color: #f3e8ff;
    color: #7c3aed;
  }

  /* Call cards */
  .print-call-card {
    border: 1px solid #d1d5db;
    padding: 12px;
    margin-bottom: 15px;
    border-radius: 4px;
    background-color: #ffffff;
    page-break-inside: avoid;
  }

  .print-call-header {
    background-color: #eff6ff;
    margin: -12px -12px 12px -12px;
    padding: 10px 12px;
    border-bottom: 1px solid #d1d5db;
    border-radius: 4px 4px 0 0;
  }

  .print-call-client-info {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    font-size: 10px;
  }

  .print-call-message {
    font-size: 11px;
    padding: 10px;
    background-color: #f9fafb;
    border-radius: 4px;
    margin-top: 10px;
  }

  /* Footer */
  .print-footer {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 10px;
    color: #6b7280;
  }

  /* Print toolbar (hidden when printing) */
  .print-toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    color: #1f2937;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-bottom: 1px solid #e5e7eb;
  }

  .print-toolbar-title {
    font-weight: 600;
    font-size: 16px;
    color: #1f2937;
  }

  .print-toolbar-actions {
    display: flex;
    gap: 10px;
  }

  .print-toolbar-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #d1d5db;
    transition: all 0.2s;
  }

  .print-toolbar-btn-primary {
    background-color: #1e40af;
    color: white;
    border-color: #1e40af;
  }

  .print-toolbar-btn-primary:hover {
    background-color: #1e3a8a;
    border-color: #1e3a8a;
  }

  .print-toolbar-btn-secondary {
    background-color: #f9fafb;
    color: #374151;
  }

  .print-toolbar-btn-secondary:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }

  /* Spacing for toolbar */
  .print-content-with-toolbar {
    margin-top: 60px;
  }
`;

export default {
  openPrintPage,
  buildPrintUrl,
  CustomerPrintUrls,
  PolicyPrintUrls,
  openCustomerPrintPage,
  openPolicyPrintPage,
  triggerPrint,
  downloadAsPdf,
  PRINT_STYLES,
  PRINT_CSS,
};
