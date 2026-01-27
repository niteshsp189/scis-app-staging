/**
 * Print Footer Component
 * Common footer for all print pages
 */

interface PrintFooterProps {
  generatedAt?: Date;
  showPageInfo?: boolean;
}

export const PrintFooter = ({
  generatedAt: _generatedAt = new Date(),
  showPageInfo: _showPageInfo = true,
}: PrintFooterProps) => {
  // Footer content removed as per user request
  return null;
};

export default PrintFooter;
