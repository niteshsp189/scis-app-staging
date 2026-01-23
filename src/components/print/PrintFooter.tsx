/**
 * Print Footer Component
 * Common footer for all print pages
 */

import { formatPrintDateTime } from '@/utils/printUtils';

interface PrintFooterProps {
  generatedAt?: Date;
  showPageInfo?: boolean;
}

export const PrintFooter = ({
  generatedAt = new Date(),
  showPageInfo = true,
}: PrintFooterProps) => {
  return (
    <div className="print-footer">
      <p>THIS DOCUMENT WAS GENERATED ON: {formatPrintDateTime(generatedAt).toUpperCase()}</p>
      <p>Insurance CRM System - SCIS</p>
      {showPageInfo && <p style={{ marginTop: '5px' }}>End of Report</p>}
    </div>
  );
};

export default PrintFooter;
