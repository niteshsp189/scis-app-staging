/**
 * Print Toolbar Component
 * Sticky toolbar with Print and Download buttons (hidden when printing)
 */

import { Printer, Download, X, ArrowLeft } from 'lucide-react';
import { triggerPrint } from '@/services/printService';

interface PrintToolbarProps {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  showDownload?: boolean;
}

export const PrintToolbar = ({
  title,
  onClose,
  onBack,
  showDownload = true,
}: PrintToolbarProps) => {
  const handlePrint = () => {
    triggerPrint();
  };

  const handleDownload = () => {
    // Browser's print dialog allows saving as PDF
    triggerPrint();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Since print pages open in new tabs, close the tab
      window.close();
    }
  };

  return (
    <div className="print-toolbar no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button
          className="print-toolbar-btn print-toolbar-btn-secondary"
          onClick={handleBack}
          title="Close"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <span className="print-toolbar-title">{title}</span>
      </div>

      <div className="print-toolbar-actions">
        <button
          className="print-toolbar-btn print-toolbar-btn-primary"
          onClick={handlePrint}
        >
          <Printer size={18} />
          Print
        </button>

        {showDownload && (
          <button
            className="print-toolbar-btn print-toolbar-btn-secondary"
            onClick={handleDownload}
          >
            <Download size={18} />
            Download PDF
          </button>
        )}

        <button
          className="print-toolbar-btn print-toolbar-btn-secondary"
          onClick={handleClose}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default PrintToolbar;
