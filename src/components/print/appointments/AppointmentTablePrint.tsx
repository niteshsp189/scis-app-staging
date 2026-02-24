/**
 * Appointment Table Print Component
 * Displays appointments in a tabular format for printing
 */

import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';
import { Appointment } from '@/services/appointmentService';
import { stripHtml } from '@/lib/htmlUtils';

interface AppointmentTablePrintProps {
  appointments: Appointment[];
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
    assignedTo?: string;
    createdBy?: string;
    location?: string;
  };
  groupByDate?: boolean;
}

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

const groupAppointmentsByDate = (appointments: Appointment[]): Map<string, Appointment[]> => {
  const grouped = new Map<string, Appointment[]>();

  appointments.forEach((apt) => {
    const date = apt.start_datetime.split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(apt);
  });

  return grouped;
};

const cellStyle = {
  border: '1px solid #e5e7eb',
  padding: '3px 8px',
  borderRadius: '3px',
};

export const AppointmentTablePrint = ({
  appointments,
  filters,
  groupByDate = true,
}: AppointmentTablePrintProps) => {
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  const groupedAppointments = groupByDate
    ? groupAppointmentsByDate(sortedAppointments)
    : null;

  return (
    <div className="print-section">
      {/* Filter Summary */}
      {filters && Object.keys(filters).some(k => filters[k as keyof typeof filters]) && (
        <div className="print-filter-summary" style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          padding: '10px 15px',
          marginBottom: '20px',
          fontSize: '10pt',
        }}>
          <strong>Filters Applied:</strong>
          <span style={{ marginLeft: '15px' }}>
            {filters.startDate && filters.endDate && (
              <span className="print-filter-tag" style={{
                backgroundColor: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '10px',
                marginRight: '10px',
              }}>
                {formatPrintDate(filters.startDate)} - {formatPrintDate(filters.endDate)}
              </span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span className="print-filter-tag" style={{
                backgroundColor: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '10px',
                marginRight: '10px',
              }}>
                Status: {getStatusLabel(filters.status)}
              </span>
            )}
            {filters.type && filters.type !== 'all' && (
              <span className="print-filter-tag" style={{
                backgroundColor: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '10px',
                marginRight: '10px',
              }}>
                Type: {getTypeLabel(filters.type)}
              </span>
            )}
            {filters.assignedTo && (
              <span className="print-filter-tag" style={{
                backgroundColor: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '10px',
                marginRight: '10px',
              }}>
                Assigned To: {filters.assignedTo}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '15px',
        fontSize: '10pt',
        color: '#6b7280',
      }}>
        <span>Total Appointments: <strong>{appointments.length}</strong></span>
        <span>
          Scheduled: {appointments.filter(a => a.status === 'scheduled').length} |
          Completed: {appointments.filter(a => a.status === 'completed').length} |
          Cancelled: {appointments.filter(a => a.status === 'cancelled').length}
        </span>
      </div>

      {groupByDate && groupedAppointments ? (
        // Grouped by date view - expanded card layout
        Array.from(groupedAppointments.entries()).map(([date, dayAppointments]) => (
          <div key={date} style={{ marginBottom: '20px' }}>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '8px 12px',
              fontWeight: 'bold',
              fontSize: '11pt',
              borderLeft: '4px solid #3b82f6',
              marginBottom: '10px',
            }}>
              {formatPrintDate(date)} ({dayAppointments.length} appointments)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dayAppointments.map((apt) => (
                <div key={apt.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '9pt',
                  pageBreakInside: 'avoid',
                }}>
                  {/* Row 1: Client name + Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '10pt' }}>
                      {apt.customer
                        ? `${apt.customer.first_name} ${apt.customer.last_name}`
                        : apt.lead
                        ? `${apt.lead.first_name} ${apt.lead.last_name} (Lead)`
                        : 'No client assigned'}
                    </strong>
                    <span style={{
                      backgroundColor: getStatusColor(apt.status),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '8pt',
                    }}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9pt' }}>
                    <div style={cellStyle}><span style={{ color: '#6b7280' }}>By Employee: </span>{apt.creator ? `${apt.creator.first_name} ${apt.creator.last_name}` : 'N/A'}</div>
                    <div style={cellStyle}><span style={{ color: '#6b7280' }}>For Employee: </span>{apt.assigned_user ? `${apt.assigned_user.first_name} ${apt.assigned_user.last_name}` : 'Unassigned'}</div>
                    <div style={cellStyle}><span style={{ color: '#6b7280' }}>Date: </span>{formatPrintDate(apt.start_datetime)}</div>
                    <div style={cellStyle}>
                      <span style={{ color: '#6b7280' }}>Meeting Time: </span>
                      {formatPrintTime(apt.start_datetime)}
                      {apt.end_datetime && ` - ${formatPrintTime(apt.end_datetime)}`}
                    </div>
                    <div style={cellStyle}><span style={{ color: '#6b7280' }}>Office: </span>{apt.office_location?.name || apt.location || 'N/A'}</div>
                    <div style={cellStyle}><span style={{ color: '#6b7280' }}>Type: </span>{getTypeLabel(apt.appointment_type)}</div>
                    {apt.customer?.cell_phone && (
                      <div style={cellStyle}><span style={{ color: '#6b7280' }}>Phone: </span>{apt.customer.cell_phone}</div>
                    )}
                  </div>

                  {/* Notes */}
                  {(apt.notes || apt.description) && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6', fontSize: '9pt' }}>
                      <span style={{ color: '#6b7280' }}>Note: </span>{stripHtml(apt.notes || apt.description || '')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        // Flat view - expanded card layout (no grouping)
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedAppointments.map((apt) => (
            <div key={apt.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '9pt',
              pageBreakInside: 'avoid',
            }}>
              {/* Row 1: Client name + Status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '10pt' }}>
                  {apt.customer
                    ? `${apt.customer.first_name} ${apt.customer.last_name}`
                    : apt.lead
                    ? `${apt.lead.first_name} ${apt.lead.last_name} (Lead)`
                    : 'No client assigned'}
                </strong>
                <span style={{
                  backgroundColor: getStatusColor(apt.status),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '8pt',
                }}>
                  {getStatusLabel(apt.status)}
                </span>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9pt' }}>
                <div style={cellStyle}><span style={{ color: '#6b7280' }}>By Employee: </span>{apt.creator ? `${apt.creator.first_name} ${apt.creator.last_name}` : 'N/A'}</div>
                <div style={cellStyle}><span style={{ color: '#6b7280' }}>For Employee: </span>{apt.assigned_user ? `${apt.assigned_user.first_name} ${apt.assigned_user.last_name}` : 'Unassigned'}</div>
                <div style={cellStyle}><span style={{ color: '#6b7280' }}>Date: </span>{formatPrintDate(apt.start_datetime)}</div>
                <div style={cellStyle}>
                  <span style={{ color: '#6b7280' }}>Meeting Time: </span>
                  {formatPrintTime(apt.start_datetime)}
                  {apt.end_datetime && ` - ${formatPrintTime(apt.end_datetime)}`}
                </div>
                <div style={cellStyle}><span style={{ color: '#6b7280' }}>Office: </span>{apt.office_location?.name || apt.location || 'N/A'}</div>
                <div style={cellStyle}><span style={{ color: '#6b7280' }}>Type: </span>{getTypeLabel(apt.appointment_type)}</div>
                {apt.customer?.cell_phone && (
                  <div style={cellStyle}><span style={{ color: '#6b7280' }}>Phone: </span>{apt.customer.cell_phone}</div>
                )}
              </div>

              {/* Notes */}
              {(apt.notes || apt.description) && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6', fontSize: '9pt' }}>
                  <span style={{ color: '#6b7280' }}>Note: </span>{stripHtml(apt.notes || apt.description || '')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontStyle: 'italic',
        }}>
          No appointments found for the selected criteria.
        </div>
      )}
    </div>
  );
};

export default AppointmentTablePrint;
