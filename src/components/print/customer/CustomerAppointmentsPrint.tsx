/**
 * Customer Appointments Print Section
 * Displays upcoming and past appointments
 */

import { formatPrintDateTime, formatPrintDate } from '@/utils/printUtils';

interface Appointment {
  id: string;
  title?: string;
  description?: string;
  appointment_type: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  notes?: string;
  assigned_user?: {
    first_name?: string;
    last_name?: string;
  };
}

interface CustomerAppointmentsPrintProps {
  appointments: Appointment[];
}

const getAppointmentTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    phone_call: 'Phone Call',
    video_call: 'Video Call',
    in_person: 'In Person',
    home_visit: 'Home Visit',
    office_visit: 'Office Visit',
    follow_up: 'Follow Up',
    consultation: 'Consultation',
    review: 'Review',
    other: 'Other',
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    rescheduled: 'Rescheduled',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    scheduled: 'badge-blue',
    confirmed: 'badge-green',
    in_progress: 'badge-yellow',
    completed: 'badge-green',
    cancelled: 'badge-red',
    no_show: 'badge-red',
    rescheduled: 'badge-yellow',
  };
  return colorMap[status] || 'badge-gray';
};

const getAssignedUserName = (user?: { first_name?: string; last_name?: string }): string => {
  if (!user) return 'N/A';
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
};

const getDuration = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins} min`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const isUpcoming = (dateStr: string): boolean => {
  return new Date(dateStr) > new Date();
};

export const CustomerAppointmentsPrint = ({ appointments }: CustomerAppointmentsPrintProps) => {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">Appointments</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No appointments found.</p>
      </div>
    );
  }

  // Separate upcoming and past appointments
  const upcomingAppointments = appointments.filter((apt) => isUpcoming(apt.start_datetime));
  const pastAppointments = appointments.filter((apt) => !isUpcoming(apt.start_datetime));

  return (
    <div className="print-section">
      <h3 className="print-section-title">Appointments</h3>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#166534' }}>
            Upcoming Appointments ({upcomingAppointments.length})
          </div>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>{formatPrintDateTime(apt.start_datetime)}</td>
                    <td>{getAppointmentTypeLabel(apt.appointment_type)}</td>
                    <td>{getDuration(apt.start_datetime, apt.end_datetime)}</td>
                    <td>{apt.location || 'N/A'}</td>
                    <td>{getAssignedUserName(apt.assigned_user)}</td>
                    <td>
                      <span className={`print-badge ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#6b7280' }}>
            Past Appointments ({pastAppointments.length})
          </div>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pastAppointments.slice(0, 10).map((apt) => (
                  <tr key={apt.id}>
                    <td>{formatPrintDateTime(apt.start_datetime)}</td>
                    <td>{getAppointmentTypeLabel(apt.appointment_type)}</td>
                    <td>{getDuration(apt.start_datetime, apt.end_datetime)}</td>
                    <td>{apt.location || 'N/A'}</td>
                    <td>{getAssignedUserName(apt.assigned_user)}</td>
                    <td>
                      <span className={`print-badge ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pastAppointments.length > 10 && (
            <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '5px' }}>
              ... and {pastAppointments.length - 10} more past appointments
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerAppointmentsPrint;
