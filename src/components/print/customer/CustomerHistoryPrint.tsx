/**
 * Customer History Print Section
 * Displays audit log history
 */

import { formatPrintDateTime } from '@/utils/printUtils';

interface AuditLog {
  id: number | string;
  event: string;
  event_label?: string;
  description?: string;
  changes_count?: number;
  time_since?: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface CustomerHistoryPrintProps {
  historyLogs: AuditLog[];
}

const getEventLabel = (event: string): string => {
  const eventMap: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    restored: 'Restored',
    login: 'Login',
    logout: 'Logout',
    password_changed: 'Password Changed',
    status_changed: 'Status Changed',
  };
  return eventMap[event.toLowerCase()] || event.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getEventColor = (event: string): string => {
  const colorMap: Record<string, string> = {
    created: 'badge-green',
    updated: 'badge-blue',
    deleted: 'badge-red',
    restored: 'badge-purple',
    login: 'badge-gray',
    logout: 'badge-gray',
  };
  return colorMap[event.toLowerCase()] || 'badge-gray';
};

const getUserName = (user?: AuditLog['user']): string => {
  if (!user) return 'System';
  if (user.name) return user.name;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.email || 'Unknown';
};

export const CustomerHistoryPrint = ({ historyLogs }: CustomerHistoryPrintProps) => {
  if (!historyLogs || historyLogs.length === 0) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">History</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No history records found.</p>
      </div>
    );
  }

  return (
    <div className="print-section">
      <h3 className="print-section-title">History</h3>
      
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '150px' }}>Date/Time</th>
            <th style={{ width: '100px' }}>Action</th>
            <th>Description</th>
            <th style={{ width: '70px' }}>Changes</th>
            <th style={{ width: '120px' }}>User</th>
          </tr>
        </thead>
        <tbody>
          {historyLogs.map((log) => (
            <tr key={log.id}>
              <td>{formatPrintDateTime(log.created_at)}</td>
              <td>
                <span className={`print-badge ${getEventColor(log.event)}`}>
                  {log.event_label || getEventLabel(log.event)}
                </span>
              </td>
              <td>{log.description || 'No description'}</td>
              <td style={{ textAlign: 'center' }}>{log.changes_count || 0}</td>
              <td>{getUserName(log.user)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerHistoryPrint;
