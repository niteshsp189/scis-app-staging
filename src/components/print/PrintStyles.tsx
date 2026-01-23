/**
 * Print Styles Component
 * Injects print-specific CSS styles into the page
 */

import { PRINT_STYLES, PRINT_CSS } from '@/services/printService';

export const PrintStyles = () => {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          ${PRINT_STYLES}
          ${PRINT_CSS}
        `,
      }}
    />
  );
};

export default PrintStyles;
