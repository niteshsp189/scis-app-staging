/**
 * Calls Table Print Component
 * Displays call logs in a printable table format
 */

import { CustomerActivity } from '@/services/customerActivitiesService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

interface CallTablePrintProps {
  calls: CustomerActivity[];
  filters?: {
    customerType?: string;
    startDate?: string;
    endDate?: string;
  };
}

export const CallTablePrint = ({ 
  calls, 
  filters,
}: CallTablePrintProps) => {
  // Helper to get performer name
  const getPerformerName = (call: CustomerActivity): string => {
    if (call.performer) {
      return `${call.performer.first_name} ${call.performer.last_name}`;
    }
    return '—';
  };

  // Helper to get customer name from the activity
  const getCustomerName = (call: CustomerActivity & { customer?: { first_name: string; last_name: string } }): string => {
    if (call.customer) {
      return `${call.customer.first_name} ${call.customer.last_name}`;
    }
    return '—';
  };

  // Helper to get called for user
  const getCalledForUser = (call: CustomerActivity): string => {
    const user = call.calledForUser || call.called_for_user;
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return '—';
  };

  // Check if any filters are active
  const hasActiveFilters = filters && (
    (filters.customerType && filters.customerType !== 'all') ||
    filters.startDate ||
    filters.endDate
  );

  // Separate calls by type
  const incomingCalls = calls.filter(c => c.activity_type === 'Incoming Call');
  const outgoingCalls = calls.filter(c => c.activity_type === 'Outgoing Call');

  // Calculate stats
  const stats = {
    total: calls.length,
    incoming: incomingCalls.length,
    outgoing: outgoingCalls.length,
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
            {filters.customerType && filters.customerType !== 'all' && (
              <span><strong>Customer Type:</strong> {filters.customerType}</span>
            )}
            {filters.startDate && (
              <span><strong>From:</strong> {formatPrintDate(filters.startDate)}</span>
            )}
            {filters.endDate && (
              <span><strong>To:</strong> {formatPrintDate(filters.endDate)}</span>
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
          <strong>Total Calls:</strong> {stats.total}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#dcfce7',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Incoming:</strong> {stats.incoming}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#dbeafe',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Outgoing:</strong> {stats.outgoing}
        </div>
      </div>

      {/* Calls Table */}
      {calls.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          No call logs found matching the current filters.
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
                Type
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Date/Time
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Customer
              </th>
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
                Performed By
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Called For
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
            </tr>
          </thead>
          <tbody>
            {calls.map((call, index) => (
              <tr 
                key={call.id}
                style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                }}
              >
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 500,
                    backgroundColor: call.activity_type === 'Incoming Call' 
                      ? '#dcfce7' 
                      : '#dbeafe',
                    color: call.activity_type === 'Incoming Call' 
                      ? '#16a34a' 
                      : '#2563eb',
                  }}>
                    {call.activity_type === 'Incoming Call' ? '↓ IN' : '↑ OUT'}
                  </span>
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  whiteSpace: 'nowrap',
                }}>
                  <div>{formatPrintDate(call.activity_date)}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>
                    {formatPrintTime(call.activity_time)}
                  </div>
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  {getCustomerName(call as CustomerActivity & { customer?: { first_name: string; last_name: string } })}
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  maxWidth: '200px',
                }}>
                  <div style={{ fontWeight: 500, color: '#111827' }}>
                    {call.title}
                  </div>
                  {call.description && (
                    <div style={{
                      fontSize: '10px',
                      color: '#6b7280',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {call.description}
                    </div>
                  )}
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  {getPerformerName(call)}
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  {getCalledForUser(call)}
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 500,
                    backgroundColor: call.status === 'Completed' 
                      ? '#dcfce7' 
                      : call.status === 'Pending'
                        ? '#fef3c7'
                        : '#f3f4f6',
                    color: call.status === 'Completed' 
                      ? '#16a34a' 
                      : call.status === 'Pending'
                        ? '#d97706'
                        : '#6b7280',
                  }}>
                    {call.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CallTablePrint;
