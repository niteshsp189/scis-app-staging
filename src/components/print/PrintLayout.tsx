/**
 * Print Layout Component
 * Base wrapper for all print pages
 */

import { ReactNode } from 'react';
import { PrintStyles } from './PrintStyles';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { PrintToolbar } from './PrintToolbar';

interface PrintLayoutProps {
  title: string;
  subtitle?: string;
  customerName?: string;
  customerId?: number;
  children: ReactNode;
  showToolbar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  generatedAt?: Date;
  onClose?: () => void;
  onBack?: () => void;
}

export const PrintLayout = ({
  title,
  subtitle,
  customerName,
  customerId,
  children,
  showToolbar = true,
  showHeader = true,
  showFooter = true,
  generatedAt = new Date(),
  onClose,
  onBack,
}: PrintLayoutProps) => {
  return (
    <>
      <PrintStyles />
      
      {showToolbar && (
        <PrintToolbar
          title={title}
          onClose={onClose}
          onBack={onBack}
        />
      )}

      <div className={`print-page ${showToolbar ? 'print-content-with-toolbar' : ''}`}>
        <div className="print-container">
          {showHeader && (
            <PrintHeader
              title={title}
              subtitle={subtitle}
              customerName={customerName}
              customerId={customerId}
              generatedAt={generatedAt}
            />
          )}

          <div className="print-content">
            {children}
          </div>

          {showFooter && (
            <PrintFooter generatedAt={generatedAt} />
          )}
        </div>
      </div>
    </>
  );
};

export default PrintLayout;
