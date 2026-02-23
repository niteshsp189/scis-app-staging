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

const cellStyle = {
  border: '1px solid #e5e7eb',
  padding: '3px 8px',
  borderRadius: '3px',
};

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

      {/* Reminders */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reminders.map((reminder) => {
            const overdueStatus = isOverdue(reminder);
            return (
              <div
                key={reminder.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '11px',
                  pageBreakInside: 'avoid',
                  opacity: reminder.status === 'completed' ? 0.75 : 1,
                }}
              >
                {/* Row 1: Title + Status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{
                    fontSize: '12px',
                    textDecoration: reminder.status === 'completed' ? 'line-through' : 'none',
                  }}>
                    {reminder.title}
                  </strong>
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
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
                  <div style={cellStyle}><span style={{ color: '#6b7280' }}>By: </span>{getCreatorName(reminder)}</div>
                  <div style={cellStyle}><span style={{ color: '#6b7280' }}>For: </span>{getAssignedName(reminder)}</div>
                  <div style={cellStyle}><span style={{ color: '#6b7280' }}>Date: </span>{formatPrintDate(reminder.reminder_datetime)} {formatPrintTime(reminder.reminder_datetime)}</div>
                  <div style={cellStyle}><span style={{ color: '#6b7280' }}>Contact: </span>{getContactName(reminder)}</div>
                </div>

                {/* Description / Notes */}
                {reminder.description && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6', fontSize: '11px' }}>
                    <span style={{ color: '#6b7280' }}>Note: </span>{reminder.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReminderTablePrint;
