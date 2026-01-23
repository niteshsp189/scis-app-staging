/**
 * Missing Information Print Component
 * Displays customers with missing information in a printable format
 */

import { MissingInfoCustomer } from '@/services/missingInfoService';
import { CustomerColumn } from '@/services/duplicateFinderService';

interface MissingInfoPrintProps {
  customers: MissingInfoCustomer[];
  filters?: {
    columns: string[];
    customerType?: string;
  };
  availableColumns?: CustomerColumn[];
}

export const MissingInfoPrint = ({ 
  customers, 
  filters,
  availableColumns = [],
}: MissingInfoPrintProps) => {
  // Get column label from value
  const getColumnLabel = (value: string): string => {
    const column = availableColumns.find(c => c.value === value);
    return column?.label || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate stats
  const stats = {
    totalCustomers: customers.length,
    totalMissingFields: customers.reduce((sum, c) => sum + (c.missing_count || c.missing_fields?.length || 0), 0),
    avgMissingFields: customers.length > 0 
      ? Math.round(customers.reduce((sum, c) => sum + (c.missing_count || c.missing_fields?.length || 0), 0) / customers.length * 10) / 10
      : 0,
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
                <strong>Checked Columns:</strong> {filters.columns.map(c => getColumnLabel(c)).join(', ')}
              </span>
            )}
            {filters.customerType && filters.customerType !== 'all' && (
              <span><strong>Customer Type:</strong> {filters.customerType}</span>
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
          <strong>Customers Found:</strong> {stats.totalCustomers}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#fed7aa',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Total Missing Fields:</strong> {stats.totalMissingFields}
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#fef3c7',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          <strong>Avg Missing/Customer:</strong> {stats.avgMissingFields}
        </div>
      </div>

      {/* Customers Table */}
      {customers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          No customers found with missing information.
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
                Customer Name
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Email
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
              }}>
                Phone
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
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
                Missing Fields
              </th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151',
                width: '60px',
              }}>
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr 
                key={customer.id}
                style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                }}
              >
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: 500,
                  color: '#111827',
                }}>
                  {customer.first_name} {customer.last_name}
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: customer.email ? '#6b7280' : '#ef4444',
                }}>
                  {customer.email || 'Missing'}
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  color: (customer.home_phone || customer.cell_phone || customer.work_phone) ? '#6b7280' : '#ef4444',
                }}>
                  {customer.home_phone || customer.cell_phone || customer.work_phone || 'Missing'}
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
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                  }}>
                    {customer.customer_type || customer.status}
                  </span>
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '4px',
                  }}>
                    {(customer.missing_fields || []).map((field, fieldIndex) => (
                      <span 
                        key={fieldIndex}
                        style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 500,
                          backgroundColor: '#fed7aa',
                          color: '#c2410c',
                        }}
                      >
                        {getColumnLabel(field)}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                  }}>
                    {customer.missing_count || customer.missing_fields?.length || 0}
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

export default MissingInfoPrint;
