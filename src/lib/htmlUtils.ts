// Helper function to strip HTML tags and get plain text
export function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    // Server-side fallback
    return html.replace(/<[^>]*>/g, '');
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Helper function to safely render HTML content
export function renderHtmlContent(html: string): { __html: string } {
  // Basic sanitization - in production, use DOMPurify
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
  return { __html: sanitized };
}
