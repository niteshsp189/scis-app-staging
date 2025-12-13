
interface CustomerDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  category: string;
  uploadedBy: string;
}

interface DocumentsSectionProps {
  documents?: CustomerDocument[];
}

export const DocumentsSection = ({ documents }: DocumentsSectionProps) => {
  if (!documents || documents.length === 0) {
    return '';
  }

  return `
    <div class="section">
      <h3>Attached Documents</h3>
      ${documents.map(document => `
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <div class="detail-row">
            <span class="detail-label">Document:</span>
            <span>${document.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span>${document.type} (${Math.round(document.size / 1024)} KB)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category:</span>
            <span>${document.category}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Uploaded:</span>
            <span>${new Date(document.uploadDate).toLocaleDateString()} by ${document.uploadedBy}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};
