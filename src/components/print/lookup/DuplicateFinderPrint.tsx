/**
 * Duplicate Finder Print Component
 * Displays duplicate customer groups in a printable format
 */

import { DuplicateGroup, CustomerColumn } from '@/services/duplicateFinderService';

interface DuplicateFinderPrintProps {
  groups: DuplicateGroup[];
  filters?: {
    columns: string[];
    customerType?: string;
    matchType?: 'exact' | 'similar';
  };
  availableColumns?: CustomerColumn[];
}

export const DuplicateFinderPrint = ({ 
  groups, 
  filters,
  availableColumns = [],
}: DuplicateFinderPrintProps) => {
  // Get column label from value
  const getColumnLabel = (value: string): string => {
    const column = availableColumns.find(c => c.value === value);
    return column?.label || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate stats
  const stats = {
    totalGroups: groups.length,
    totalDuplicates: groups.reduce((sum, group) => sum + group.duplicate_count, 0),
    totalCustomers: groups.reduce((sum, group) => sum + group.customers.length, 0),
  };

  return (
    <div>
      {/* Filter Summary */}
      {filters && (
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
            Search Criteria:
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            fontSize: '11px',
            color: '#64748b',
          }}>
            {filters.columns && filters.columns.length > 0 && (
              <span>
                <strong>Columns:</strong> {filters.columns.map(c => getColumnLabel(c)).join(', ')}
              </span>
            )}
            {filters.customerType && filters.customerType !== 'all' && (
              <span><strong>Customer Type:</strong> {filters.customerType}</span>
            )}
            {filters.matchType && (
              <span><strong>Match Type:</strong> {filters.matchType === 'exact' ? 'Exact' : 'Similar'}</span>
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
          <strong>Duplicate Groups:</strong> {stats.totalGroups}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#fef3c7',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Total Duplicates:</strong> {stats.totalDuplicates}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#dbeafe',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Total Customers:</strong> {stats.totalCustomers}
        </div>
      </div>

      {/* Duplicate Groups */}
      {groups.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          No duplicate groups found matching the search criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groups.map((group, groupIndex) => (
            <div 
              key={group.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                pageBreakInside: 'avoid',
              }}
            >
              {/* Group Header */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: '14px',
                    color: '#111827',
                  }}>
                    Group {groupIndex + 1}
                  </span>
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}>
                    {group.duplicate_count} duplicates
                  </span>
                </div>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#dbeafe',
                  color: '#2563eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                }}>
                  {Math.round(group.similarity_score * 100)}% match
                </span>
              </div>

              {/* Matching Fields */}
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#fffbeb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '11px',
                color: '#92400e',
              }}>
                <strong>Matching Fields:</strong> {group.matching_fields.join(', ')}
              </div>

              {/* Customers Table */}
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px',
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{
                      padding: '8px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      Email
                    </th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      Phone
                    </th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      Location
                    </th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'center',
                      borderBottom: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.customers.map((customer, customerIndex) => (
                    <tr 
                      key={customer.id}
                      style={{ 
                        backgroundColor: customerIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                      }}
                    >
                      <td style={{
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 500,
                        color: '#111827',
                      }}>
                        {customer.first_name} {customer.last_name}
                      </td>
                      <td style={{
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                      }}>
                        {customer.email || '—'}
                      </td>
                      <td style={{
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                      }}>
                        {customer.home_phone || customer.cell_phone || customer.work_phone || '—'}
                      </td>
                      <td style={{
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        color: '#6b7280',
                        fontSize: '10px',
                      }}>
                        {[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        textAlign: 'center',
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 500,
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                        }}>
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DuplicateFinderPrint;
