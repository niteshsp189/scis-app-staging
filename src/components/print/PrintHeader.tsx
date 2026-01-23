/**
 * Print Header Component
 * Common header for all print pages with logo, title, and metadata
 */

import { formatPrintDateTime } from '@/utils/printUtils';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  customerName?: string;
  customerId?: number;
  generatedAt?: Date;
}

export const PrintHeader = ({
  title,
  subtitle,
  customerName,
  customerId,
  generatedAt = new Date(),
}: PrintHeaderProps) => {
  return (
    <div className="print-header">
      <div className="print-header-logo">
        {/* SCIS Logo */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2" />
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            SC
          </text>
        </svg>
        <div>
          <h1 className="print-header-title">{title}</h1>
          {subtitle && <p className="print-header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="print-header-meta">
        <div>
          {customerName && <span>Client: <strong>{customerName}</strong></span>}
          {customerId && <span style={{ marginLeft: '20px' }}>ID: <strong>{customerId}</strong></span>}
        </div>
        <div>
          Generated: {formatPrintDateTime(generatedAt)}
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
