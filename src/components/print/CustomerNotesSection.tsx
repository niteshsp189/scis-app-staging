
interface CustomerNote {
  id: string;
  content: string;
  color: string;
  category: string;
  timestamp: string;
  createdBy: string;
}

interface CustomerNotesSectionProps {
  notes?: CustomerNote[];
}

export const CustomerNotesSection = ({ notes }: CustomerNotesSectionProps) => {
  if (!notes || notes.length === 0) {
    return '';
  }

  return `
    <div class="section">
      <h3>Customer Notes & Reminders</h3>
      ${notes.map(note => `
        <div class="note note-${note.color}">
          <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
            <strong>${note.category}</strong> - ${new Date(note.timestamp).toLocaleString()} by ${note.createdBy}
          </div>
          <div>${note.content}</div>
        </div>
      `).join('')}
    </div>
  `;
};
