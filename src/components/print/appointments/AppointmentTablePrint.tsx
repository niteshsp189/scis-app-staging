/**
 * Appointment Table Print Component
 * Displays appointments in a tabular format for printing
 */

import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';
import { Appointment } from '@/services/appointmentService';

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
        // Grouped by date view
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
            
            <table className="print-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '9pt',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Time</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Client</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Location</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Assigned To</th>
                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dayAppointments.map((apt) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px' }}>
                      {formatPrintTime(apt.start_datetime)}
                      {apt.end_datetime && (
                        <span style={{ color: '#6b7280' }}> - {formatPrintTime(apt.end_datetime)}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {apt.customer ? (
                        <>
                          <strong>{apt.customer.first_name} {apt.customer.last_name}</strong>
                          {apt.customer.cell_phone && (
                            <span style={{ display: 'block', fontSize: '8pt', color: '#6b7280' }}>
                              {apt.customer.cell_phone}
                            </span>
                          )}
                        </>
                      ) : apt.lead ? (
                        <>
                          <strong>{apt.lead.first_name} {apt.lead.last_name}</strong>
                          <span style={{ color: '#f59e0b', fontSize: '8pt' }}> (Lead)</span>
                        </>
                      ) : (
                        <span style={{ color: '#6b7280' }}>No client assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>{getTypeLabel(apt.appointment_type)}</td>
                    <td style={{ padding: '8px' }}>
                      {apt.office_location?.name || apt.location || 'N/A'}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {apt.assigned_user 
                        ? `${apt.assigned_user.first_name} ${apt.assigned_user.last_name}`
                        : 'Unassigned'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: getStatusColor(apt.status),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '8pt',
                      }}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        // Flat table view (no grouping)
        <table className="print-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '9pt',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Time</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Client</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Type</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Location</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Assigned To</th>
              <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedAppointments.map((apt) => (
              <tr key={apt.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px' }}>{formatPrintDate(apt.start_datetime)}</td>
                <td style={{ padding: '8px' }}>
                  {formatPrintTime(apt.start_datetime)}
                </td>
                <td style={{ padding: '8px' }}>
                  {apt.customer ? (
                    `${apt.customer.first_name} ${apt.customer.last_name}`
                  ) : apt.lead ? (
                    `${apt.lead.first_name} ${apt.lead.last_name} (Lead)`
                  ) : 'N/A'}
                </td>
                <td style={{ padding: '8px' }}>{getTypeLabel(apt.appointment_type)}</td>
                <td style={{ padding: '8px' }}>
                  {apt.office_location?.name || apt.location || 'N/A'}
                </td>
                <td style={{ padding: '8px' }}>
                  {apt.assigned_user 
                    ? `${apt.assigned_user.first_name} ${apt.assigned_user.last_name}`
                    : 'Unassigned'}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: getStatusColor(apt.status),
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '8pt',
                  }}>
                    {getStatusLabel(apt.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
