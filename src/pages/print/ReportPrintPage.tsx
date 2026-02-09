/**
 * Report Print Page
 * Opens in a new tab with report data rendered using PrintLayout.
 * Reads report type and filter params from URL search params,
 * fetches the data from the API, and renders a print-optimized table.
 */

import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { reportService } from '@/services/reportService';
import { formatPrintDate, formatPrintCurrency, formatPrintPhone } from '@/utils/printUtils';

// Column definitions per report type
const REPORT_COLUMNS: Record<string, { key: string; label: string; align?: string; format?: string }[]> = {
  'lost-clients': [
    { key: 'id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'home_phone', label: 'Phone', format: 'phone' },
    { key: 'status', label: 'Status' },
    { key: 'cancellation_date', label: 'Date', format: 'date' },
    { key: 'premium', label: 'Premium', align: 'right', format: 'currency' },
  ],
  'cancelled-customers': [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'date', label: 'Date' },
    { key: 'method', label: 'Method' },
    { key: 'reason', label: 'Reason' },
  ],
  'custom': [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'home_phone', label: 'Phone', format: 'phone' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Reg Date' },
  ],
  'general': [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'home_phone', label: 'Phone', format: 'phone' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip_code', label: 'Zip' },
    { key: 'status', label: 'Status' },
  ],
  'transfers': [
    { key: 'id', label: 'ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'home_phone', label: 'Phone', format: 'phone' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Reg Date' },
  ],
  'customers': [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'home_phone', label: 'Home Phone', format: 'phone' },
    { key: 'cell_phone', label: 'Cell Phone', format: 'phone' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip_code', label: 'Zip' },
    { key: 'referral', label: 'Referral' },
    { key: 'status', label: 'Status' },
  ],
  'upcoming-birthdays': [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'age', label: 'Age' },
    { key: 'in_days', label: 'In Days' },
    { key: 'home_phone', label: 'Phone', format: 'phone' },
    { key: 'status', label: 'Status' },
  ],
  'turning-age': [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'current_age', label: 'Current Age' },
    { key: 'turning_age', label: 'Turning' },
    { key: 'turning_date', label: 'Turning Date' },
    { key: 'in_days', label: 'In Days' },
    { key: 'home_phone', label: 'Phone', format: 'phone' },
    { key: 'status', label: 'Status' },
  ],
  'effective-date': [
    { key: 'id', label: 'ID' },
    { key: 'policy_number', label: 'Policy #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'plan_name', label: 'Plan' },
    { key: 'company_name', label: 'Company' },
    { key: 'plan_type', label: 'Type' },
    { key: 'start_date', label: 'Effective Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'premium_amount', label: 'Premium', align: 'right', format: 'currency' },
    { key: 'status', label: 'Status' },
  ],
};

const REPORT_TITLES: Record<string, string> = {
  'lost-clients': 'Lost Clients Report',
  'cancelled-customers': 'Cancelled Customers Report',
  'custom': 'Custom Report',
  'general': 'General Report',
  'transfers': 'Transfers Report',
  'customers': 'Customers Report',
  'upcoming-birthdays': 'Upcoming Birthdays Report',
  'turning-age': 'Turning Age Report',
  'effective-date': 'Effective Date Report',
};

// Map report type to API function
const fetchReport = async (type: string, params: Record<string, string>) => {
  const apiParams = { ...params, per_page: '1000' }; // Fetch all for printing
  switch (type) {
    case 'lost-clients': return reportService.getLostClients(apiParams);
    case 'cancelled-customers': return reportService.getCancelledCustomers(apiParams);
    case 'custom': return reportService.getCustomReport(apiParams);
    case 'general': return reportService.getGeneralReport(apiParams);
    case 'transfers': return reportService.getTransfersReport(apiParams);
    case 'customers': return reportService.getCustomersReport(apiParams);
    case 'upcoming-birthdays': return reportService.getUpcomingBirthdays(apiParams);
    case 'turning-age': return reportService.getTurningAge(apiParams);
    case 'effective-date': return reportService.getEffectiveDate(apiParams);
    default: throw new Error(`Unknown report type: ${type}`);
  }
};

const formatCellValue = (value: any, format?: string): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  switch (format) {
    case 'date': return formatPrintDate(value);
    case 'currency': return formatPrintCurrency(value);
    case 'phone': return formatPrintPhone(value);
    default: return String(value);
  }
};

const getStatusClass = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s === 'active' || s === 'client') return 'badge-green';
  if (s === 'pending' || s === 'prospect') return 'badge-yellow';
  if (s === 'cancelled' || s === 'former') return 'badge-red';
  if (s === 'deceased') return 'badge-gray';
  return 'badge-blue';
};

export const ReportPrintPage = () => {
  const [searchParams] = useSearchParams();
  const reportType = searchParams.get('type') || 'lost-clients';

  // Build params from URL (excluding 'type')
  const params: Record<string, any> = {};
  const seen = new Set<string>();
  searchParams.forEach((_value, key) => {
    if (key === 'type' || seen.has(key)) return;
    seen.add(key);
    const all = searchParams.getAll(key);
    params[key] = all.length > 1 ? all : all[0];
  });

  const columns = REPORT_COLUMNS[reportType] || [];
  const title = REPORT_TITLES[reportType] || 'Report';

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report-print', reportType, params],
    queryFn: () => fetchReport(reportType, params),
  });

  // Build subtitle from active filters
  const buildSubtitle = (): string => {
    const parts: string[] = [];
    if (params.company_id) parts.push(`Company: ${params.company_id}`);
    if (params.date_from) parts.push(`From: ${params.date_from}`);
    if (params.date_to) parts.push(`To: ${params.date_to}`);
    if (params.search) parts.push(`Search: "${params.search}"`);
    if (params.types || params.customer_types) parts.push(`Types: ${params.types || params.customer_types}`);
    if (params.months) parts.push(`Months: ${params.months}`);
    if (params.age) parts.push(`Age: ${params.age}`);
    if (reportData?.total !== undefined) parts.push(`Total Records: ${reportData.total}`);
    return parts.join(' | ');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#6b7280',
      }}>
        Loading report data...
      </div>
    );
  }

  const data = reportData?.data || [];

  return (
    <PrintLayout title={title} subtitle={buildSubtitle()}>
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          No records found for the selected filters.
        </div>
      ) : (
        <div className="print-section">
          <div className="print-section-title">
            {title} ({data.length} {data.length === 1 ? 'record' : 'records'})
          </div>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={col.align === 'right' ? { textAlign: 'right' } : undefined}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, idx: number) => (
                  <tr key={row.id || idx}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={col.align === 'right' ? { textAlign: 'right' } : undefined}
                      >
                        {col.key === 'status' || col.key === 'type' ? (
                          <span className={`print-badge ${getStatusClass(row[col.key])}`}>
                            {row[col.key] || 'N/A'}
                          </span>
                        ) : (
                          formatCellValue(row[col.key], col.format)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PrintLayout>
  );
};

export default ReportPrintPage;
