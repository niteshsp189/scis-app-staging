/**
 * Global Search Results Print Component
 * Displays search results in a printable table format
 */

import { SearchResult } from '@/services/globalSearchService';

interface GlobalSearchTablePrintProps {
  results: SearchResult[];
  query: string;
  filters?: {
    type?: string;
    status?: string;
    dateFrom?: string;
  };
}

export const GlobalSearchTablePrint = ({ 
  results, 
  query,
  filters,
}: GlobalSearchTablePrintProps) => {
  // Check if any filters are active
  const hasActiveFilters = filters && (
    (filters.type && filters.type !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    filters.dateFrom
  );

  // Group results by type
  const groupedResults: Record<string, SearchResult[]> = {};
  results.forEach(result => {
    if (!groupedResults[result.type]) {
      groupedResults[result.type] = [];
    }
    groupedResults[result.type].push(result);
  });

  // Calculate stats
  const stats = {
    total: results.length,
    customers: groupedResults['customer']?.length || 0,
    policies: groupedResults['policy']?.length || 0,
    appointments: groupedResults['appointment']?.length || 0,
    reminders: groupedResults['reminder']?.length || 0,
    users: groupedResults['user']?.length || 0,
  };

  // Get type label
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      customer: 'Customer',
      policy: 'Policy',
      appointment: 'Appointment',
      reminder: 'Reminder',
      prospect: 'Prospect',
      user: 'User',
    };
    return labels[type] || type;
  };

  // Get type badge color
  const getTypeBadgeStyle = (type: string): { backgroundColor: string; color: string } => {
    const styles: Record<string, { backgroundColor: string; color: string }> = {
      customer: { backgroundColor: '#dbeafe', color: '#2563eb' },
      policy: { backgroundColor: '#dcfce7', color: '#16a34a' },
      appointment: { backgroundColor: '#f3e8ff', color: '#7c3aed' },
      reminder: { backgroundColor: '#fef3c7', color: '#d97706' },
      prospect: { backgroundColor: '#fed7aa', color: '#ea580c' },
      user: { backgroundColor: '#f3f4f6', color: '#6b7280' },
    };
    return styles[type] || { backgroundColor: '#f3f4f6', color: '#6b7280' };
  };

  return (
    <div>
      {/* Search Query */}
      <div style={{
        marginBottom: '16px',
        padding: '12px 16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '6px',
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#0369a1',
        }}>
          Search Query: "{query}"
        </div>
      </div>

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
            {filters.type && filters.type !== 'all' && (
              <span><strong>Type:</strong> {filters.type}</span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span><strong>Status:</strong> {filters.status}</span>
            )}
            {filters.dateFrom && (
              <span><strong>Date From:</strong> {filters.dateFrom}</span>
            )}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f1f5f9',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Total Results:</strong> {stats.total}
        </div>
        {stats.customers > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#dbeafe',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Customers:</strong> {stats.customers}
          </div>
        )}
        {stats.policies > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#dcfce7',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Policies:</strong> {stats.policies}
          </div>
        )}
        {stats.appointments > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f3e8ff',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Appointments:</strong> {stats.appointments}
          </div>
        )}
        {stats.reminders > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#fef3c7',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Reminders:</strong> {stats.reminders}
          </div>
        )}
        {stats.users > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            <strong>Users:</strong> {stats.users}
          </div>
        )}
      </div>

      {/* Results Table */}
      {results.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          No results found matching the search criteria.
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
                width: '100px',
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
                Title
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Description
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
                width: '100px',
              }}>
                Status
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
                width: '80px',
              }}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => {
              const typeStyle = getTypeBadgeStyle(result.type);
              return (
                <tr 
                  key={`${result.type}-${result.id}-${index}`}
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
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                      ...typeStyle,
                    }}>
                      {getTypeLabel(result.type)}
                    </span>
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 500,
                    color: '#111827',
                  }}>
                    {result.title}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#6b7280',
                    maxWidth: '300px',
                  }}>
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {result.description}
                    </div>
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}>
                    {result.status && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 500,
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                      }}>
                        {result.status}
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#6b7280',
                  }}>
                    {result.relevance_score}/100
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

export default GlobalSearchTablePrint;
