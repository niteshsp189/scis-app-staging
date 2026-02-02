/**
 * Customer Notes Print Section
 * Displays notes with color coding and author information
 */

import { formatPrintDateTime, getPrintNoteColorClass } from '@/utils/printUtils';

interface Note {
  id: string;
  content: string;
  color: string;
  is_important?: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at?: string;
  creator?: {
    first_name?: string;
    last_name?: string;
  };
  created_by?: string;
}

interface CustomerNotesPrintProps {
  notes: Note[];
}

const getCreatorName = (note: Note): string => {
  if (note.creator) {
    const firstName = note.creator.first_name || '';
    const lastName = note.creator.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  }
  return note.created_by || 'Unknown';
};

export const CustomerNotesPrint = ({ notes }: CustomerNotesPrintProps) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">Notes</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No notes found.</p>
      </div>
    );
  }

  // Sort notes: pinned first, then by date descending
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="print-section">
      <h3 className="print-section-title">Notes</h3>

      {sortedNotes.map((note) => {
        const colorClass = getPrintNoteColorClass(note.color);
        const creatorName = getCreatorName(note);

        return (
          <div key={note.id} className={`print-note ${colorClass}`}>
            <div className="print-note-header">
              <span className="print-note-author">
                {note.is_pinned && '📌 '}
                {note.is_important && '⚠️ '}
                🔹 {creatorName}
              </span>
              <span>© {formatPrintDateTime(note.created_at)}</span>
            </div>
            <div
              className="print-note-content"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CustomerNotesPrint;
