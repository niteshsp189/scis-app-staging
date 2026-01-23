/**
 * Appointment Detail Print Component
 * Displays a single appointment with full details including customer info
 */

import { formatPrintDate, formatPrintTime, formatFullName } from '@/utils/printUtils';
import { Appointment } from '@/services/appointmentService';

interface Policy {
  id: number;
  policy_number?: string;
  status?: string;
  start_date?: string;
  plan?: {
    name?: string;
    company?: { name: string };
  };
  outstanding_premium?: number;
  premium_frequency?: string;
}

interface Customer {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  cell_phone?: string;
  home_phone?: string;
  work_phone?: string;
  email?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface AppointmentDetailPrintProps {
  appointment: Appointment;
  customer?: Customer | null;
  policies?: Policy[];
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    new_client: 'New Client',
    supplement: 'Supplement',
    part_d: 'Part D',
    rate_increase: 'Rate Increase',
    under_65: 'Under 65',
    dental_vision: 'Dental/Vision',
    review: 'Review',
    customer_service: 'Customer Service',
    field_time: 'Field Time',
    life_insurance: 'Life Insurance',
    meeting: 'Meeting',
    call: 'Call',
    presentation: 'Presentation',
    follow_up: 'Follow Up',
    consultation: 'Consultation',
    quote: 'Quote',
    other: 'Other',
  };
  return labels[type] || type;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    rescheduled: 'Rescheduled',
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626',
  };
  return colors[priority] || '#6b7280';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: '#3b82f6',
    confirmed: '#10b981',
    in_progress: '#f59e0b',
    completed: '#22c55e',
    cancelled: '#ef4444',
    no_show: '#6b7280',
    rescheduled: '#8b5cf6',
  };
  return colors[status] || '#6b7280';
};

const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatPhone = (phone?: string): string => {
  if (!phone) return 'N/A';
  return phone;
};

const formatAddress = (customer: Customer): string => {
  const parts = [
    customer.address,
    customer.address2,
    customer.city,
    customer.state,
    customer.zip_code,
  ].filter(Boolean);
  return parts.join(', ') || 'N/A';
};

export const AppointmentDetailPrint = ({
  appointment,
  customer,
  policies = [],
}: AppointmentDetailPrintProps) => {
  // Use customer from props or from appointment relationship
  const customerData = customer || (appointment.customer as unknown as Customer);

  const sectionStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '20px',
    overflow: 'hidden',
  };

  const sectionHeaderStyle = {
    backgroundColor: '#f3f4f6',
    padding: '10px 15px',
    fontWeight: 'bold' as const,
    fontSize: '11pt',
    borderBottom: '1px solid #e5e7eb',
  };

  const sectionContentStyle = {
    padding: '15px',
  };

  const rowStyle = {
    display: 'flex',
    marginBottom: '8px',
    fontSize: '10pt',
  };

  const labelStyle = {
    fontWeight: 'bold' as const,
    width: '140px',
    color: '#374151',
  };

  const valueStyle = {
    color: '#111827',
    flex: 1,
  };

  return (
    <div className="print-appointment-detail">
      {/* Customer Information Section */}
      {customerData && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            CLIENT INFORMATION
          </div>
          <div style={sectionContentStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Name:</span>
                  <span style={valueStyle}>
                    <strong>{formatFullName(customerData.first_name, customerData.middle_name, customerData.last_name)}</strong>
                  </span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Date of Birth:</span>
                  <span style={valueStyle}>
                    {customerData.date_of_birth 
                      ? `${formatPrintDate(customerData.date_of_birth)} (Age: ${calculateAge(customerData.date_of_birth)})`
                      : 'N/A'}
                  </span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Email:</span>
                  <span style={valueStyle}>{customerData.email || 'N/A'}</span>
                </div>
              </div>
              <div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Home Phone:</span>
                  <span style={valueStyle}>{formatPhone(customerData.home_phone)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Cell Phone:</span>
                  <span style={valueStyle}>{formatPhone(customerData.cell_phone)}</span>
                </div>
                <div style={rowStyle}>
                  <span style={labelStyle}>Work Phone:</span>
                  <span style={valueStyle}>{formatPhone(customerData.work_phone)}</span>
                </div>
              </div>
            </div>
            <div style={{ ...rowStyle, marginTop: '10px' }}>
              <span style={labelStyle}>Address:</span>
              <span style={valueStyle}>{formatAddress(customerData)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Section */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          APPOINTMENT DETAILS
        </div>
        <div style={sectionContentStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={rowStyle}>
                <span style={labelStyle}>Title:</span>
                <span style={valueStyle}><strong>{appointment.title}</strong></span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Type:</span>
                <span style={valueStyle}>{getTypeLabel(appointment.appointment_type)}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Date:</span>
                <span style={valueStyle}>{formatPrintDate(appointment.start_datetime)}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Time:</span>
                <span style={valueStyle}>
                  {formatPrintTime(appointment.start_datetime)}
                  {appointment.end_datetime && ` - ${formatPrintTime(appointment.end_datetime)}`}
                </span>
              </div>
            </div>
            <div>
              <div style={rowStyle}>
                <span style={labelStyle}>Status:</span>
                <span style={valueStyle}>
                  <span style={{
                    backgroundColor: getStatusColor(appointment.status),
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '9pt',
                  }}>
                    {getStatusLabel(appointment.status)}
                  </span>
                </span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Priority:</span>
                <span style={valueStyle}>
                  <span style={{
                    color: getPriorityColor(appointment.priority),
                    fontWeight: 'bold',
                  }}>
                    {getPriorityLabel(appointment.priority)}
                  </span>
                </span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Location:</span>
                <span style={valueStyle}>
                  {appointment.office_location?.name || appointment.location || 'N/A'}
                </span>
              </div>
              {appointment.office_location?.address && (
                <div style={rowStyle}>
                  <span style={labelStyle}></span>
                  <span style={{ ...valueStyle, fontSize: '9pt', color: '#6b7280' }}>
                    {[
                      appointment.office_location.address,
                      appointment.office_location.city,
                      appointment.office_location.state,
                      appointment.office_location.postal_code,
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginTop: '15px' }}>
            <div style={rowStyle}>
              <span style={labelStyle}>Created By:</span>
              <span style={valueStyle}>
                {appointment.creator 
                  ? `${appointment.creator.first_name} ${appointment.creator.last_name}`
                  : 'N/A'}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Assigned To:</span>
              <span style={valueStyle}>
                {appointment.assigned_user 
                  ? `${appointment.assigned_user.first_name} ${appointment.assigned_user.last_name}`
                  : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {(appointment.notes || appointment.description) && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            NOTES
          </div>
          <div style={sectionContentStyle}>
            <div style={{
              whiteSpace: 'pre-wrap',
              fontSize: '10pt',
              lineHeight: '1.5',
            }}>
              {appointment.description || appointment.notes}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Notes */}
      {appointment.status === 'cancelled' && appointment.cancellation_notes && (
        <div style={{ ...sectionStyle, borderColor: '#fecaca' }}>
          <div style={{ ...sectionHeaderStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}>
            CANCELLATION NOTES
          </div>
          <div style={sectionContentStyle}>
            <div style={{ fontSize: '10pt', color: '#dc2626' }}>
              {appointment.cancellation_notes}
            </div>
          </div>
        </div>
      )}

      {/* Client's Active Policies */}
      {policies.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            CLIENT'S ACTIVE POLICIES
          </div>
          <div style={sectionContentStyle}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '9pt',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Company</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Plan</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Policy #</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Effective</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {policies.filter(p => p.status === 'Active' || p.status === 'active').map((policy) => (
                  <tr key={policy.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>{policy.plan?.company?.name || 'N/A'}</td>
                    <td style={{ padding: '8px' }}>{policy.plan?.name || 'N/A'}</td>
                    <td style={{ padding: '8px' }}>{policy.policy_number || 'N/A'}</td>
                    <td style={{ padding: '8px' }}>
                      {policy.start_date ? formatPrintDate(policy.start_date) : 'N/A'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      ${policy.outstanding_premium?.toFixed(2) || '0.00'}
                      {policy.premium_frequency && (
                        <span style={{ fontSize: '8pt', color: '#6b7280' }}>
                          /{policy.premium_frequency}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetailPrint;
