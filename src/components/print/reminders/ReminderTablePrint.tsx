/**
 * Reminders Table Print Component
 * Displays reminders in a printable table format
 */

import { Reminder } from '@/services/reminderService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

interface ReminderTablePrintProps {
  reminders: Reminder[];
  filters?: {
    status?: string;
    createdBy?: string;
    assignedTo?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  };
  employees?: { id: string; name: string }[];
  agents?: { id: string; name: string }[];
}

export const ReminderTablePrint = ({ 
  reminders, 
  filters,
  employees = [],
  agents = [],
}: ReminderTablePrintProps) => {
  // Helper to get employee name by ID
  const getEmployeeName = (id?: string) => {
    if (!id) return '';
    const employee = employees.find(e => e.id === id);
    return employee?.name || id;
  };

  // Helper to get agent name by ID
  const getAgentName = (id?: string) => {
    if (!id) return '';
    const agent = agents.find(a => a.id === id);
    return agent?.name || id;
  };

  // Helper to check if reminder is overdue
  const isOverdue = (reminder: Reminder): boolean => {
    return (
      new Date(reminder.reminder_datetime) < new Date() &&
      reminder.status === 'pending'
    );
  };

  // Helper to get contact name
  const getContactName = (reminder: Reminder): string => {
    if (reminder.customer) {
      return `${reminder.customer.first_name} ${reminder.customer.last_name}`;
    }
    if (reminder.lead) {
      return `${reminder.lead.first_name} ${reminder.lead.last_name}`;
    }
    return '—';
  };

  // Helper to get assigned user name
  const getAssignedName = (reminder: Reminder): string => {
    if (reminder.assigned_user) {
      return `${reminder.assigned_user.first_name} ${reminder.assigned_user.last_name}`;
    }
    if (reminder.agent) {
      return `${reminder.agent.first_name} ${reminder.agent.last_name}`;
    }
    return '—';
  };

  // Helper to get creator name
  const getCreatorName = (reminder: Reminder): string => {
    if (reminder.creator) {
      return `${reminder.creator.first_name} ${reminder.creator.last_name}`;
    }
    return '—';
  };

  // Check if any filters are active
  const hasActiveFilters = filters && (
    (filters.status && filters.status !== 'all') ||
    (filters.createdBy && filters.createdBy !== 'all') ||
    (filters.assignedTo && filters.assignedTo !== 'all') ||
    filters.fromDate ||
    filters.toDate ||
    filters.search
  );

  // Calculate stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    completed: reminders.filter(r => r.status === 'completed').length,
    overdue: reminders.filter(r => isOverdue(r)).length,
  };

  return (
    <div>
      {/* Filter Summary */}
      {hasActiveFilters && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#475569',
            marginBottom: '8px',
          }}>
            Applied Filters:
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            fontSize: '11px',
            color: '#64748b',
          }}>
            {filters.status && filters.status !== 'all' && (
              <span><strong>Status:</strong> {filters.status}</span>
            )}
            {filters.createdBy && filters.createdBy !== 'all' && (
              <span><strong>Created By:</strong> {getEmployeeName(filters.createdBy) || filters.createdBy}</span>
            )}
            {filters.assignedTo && filters.assignedTo !== 'all' && (
              <span><strong>Assigned To:</strong> {getAgentName(filters.assignedTo) || filters.assignedTo}</span>
            )}
            {filters.fromDate && (
              <span><strong>From:</strong> {formatPrintDate(filters.fromDate)}</span>
            )}
            {filters.toDate && (
              <span><strong>To:</strong> {formatPrintDate(filters.toDate)}</span>
            )}
            {filters.search && (
              <span><strong>Search:</strong> "{filters.search}"</span>
            )}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f1f5f9',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Total:</strong> {stats.total}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#fef3c7',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Pending:</strong> {stats.pending}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#dcfce7',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Completed:</strong> {stats.completed}
        </div>
        {stats.overdue > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#fee2e2',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Overdue:</strong> {stats.overdue}
          </div>
        )}
      </div>

      {/* Reminders Table */}
      {reminders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          No reminders found matching the current filters.
        </div>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Title
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Due Date/Time
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Status
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Contact
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Assigned To
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Created By
              </th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder, index) => {
              const overdueStatus = isOverdue(reminder);
              return (
                <tr 
                  key={reminder.id}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                  }}
                >
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    verticalAlign: 'top',
                  }}>
                    <div style={{ 
                      fontWeight: 500,
                      color: reminder.status === 'completed' ? '#9ca3af' : '#111827',
                      textDecoration: reminder.status === 'completed' ? 'line-through' : 'none',
                    }}>
                      {reminder.title}
                    </div>
                    {reminder.description && (
                      <div style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        marginTop: '2px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {reminder.description}
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    whiteSpace: 'nowrap',
                  }}>
                    <div>{formatPrintDate(reminder.reminder_datetime)}</div>
                    <div style={{ color: '#6b7280', fontSize: '10px' }}>
                      {formatPrintTime(reminder.reminder_datetime)}
                    </div>
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '10px',
                      fontWeight: 500,
                      backgroundColor: overdueStatus 
                        ? '#fee2e2' 
                        : reminder.status === 'completed' 
                          ? '#dcfce7' 
                          : '#fef3c7',
                      color: overdueStatus 
                        ? '#dc2626' 
                        : reminder.status === 'completed' 
                          ? '#16a34a' 
                          : '#d97706',
                    }}>
                      {overdueStatus ? 'OVERDUE' : reminder.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    {getContactName(reminder)}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    {getAssignedName(reminder)}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    {getCreatorName(reminder)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReminderTablePrint;
