/**
 * Customer Appointments Print Section
 * Displays upcoming and past appointments
 */

import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';
import { stripHtml } from '@/lib/htmlUtils';

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

const getStatusBgColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    scheduled: '#3b82f6',
    confirmed: '#10b981',
    in_progress: '#f59e0b',
    completed: '#22c55e',
    cancelled: '#ef4444',
    no_show: '#6b7280',
    rescheduled: '#8b5cf6',
  };
  return colorMap[status] || '#6b7280';
};

const cellStyle = {
  border: '1px solid #e5e7eb',
  padding: '3px 8px',
  borderRadius: '3px',
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

  const renderAppointmentCards = (aptList: Appointment[], maxItems?: number) => {
    const items = maxItems ? aptList.slice(0, maxItems) : aptList;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((apt) => (
          <div key={apt.id} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '9pt',
            pageBreakInside: 'avoid',
          }}>
            {/* Row 1: Title/Type + Status badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '10pt' }}>
                {apt.title || getAppointmentTypeLabel(apt.appointment_type)}
              </strong>
              <span style={{
                backgroundColor: getStatusBgColor(apt.status),
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
              <div style={cellStyle}><span style={{ color: '#6b7280' }}>Type: </span>{getAppointmentTypeLabel(apt.appointment_type)}</div>
              <div style={cellStyle}><span style={{ color: '#6b7280' }}>Duration: </span>{getDuration(apt.start_datetime, apt.end_datetime)}</div>
              <div style={cellStyle}><span style={{ color: '#6b7280' }}>Date: </span>{formatPrintDate(apt.start_datetime)}</div>
              <div style={cellStyle}>
                <span style={{ color: '#6b7280' }}>Time: </span>
                {formatPrintTime(apt.start_datetime)}
                {apt.end_datetime && ` - ${formatPrintTime(apt.end_datetime)}`}
              </div>
              <div style={cellStyle}><span style={{ color: '#6b7280' }}>Location: </span>{apt.location || 'N/A'}</div>
              <div style={cellStyle}><span style={{ color: '#6b7280' }}>Assigned To: </span>{getAssignedUserName(apt.assigned_user)}</div>
            </div>

            {/* Notes / Description */}
            {(apt.notes || apt.description) && (
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6', fontSize: '9pt' }}>
                <span style={{ color: '#6b7280' }}>Notes: </span>{stripHtml(apt.notes || apt.description || '')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="print-section">
      <h3 className="print-section-title">Appointments</h3>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#166534',
            borderLeft: '4px solid #22c55e',
            paddingLeft: '8px',
          }}>
            Upcoming Appointments ({upcomingAppointments.length})
          </div>
          {renderAppointmentCards(upcomingAppointments)}
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#6b7280',
            borderLeft: '4px solid #9ca3af',
            paddingLeft: '8px',
          }}>
            Past Appointments ({pastAppointments.length})
          </div>
          {renderAppointmentCards(pastAppointments, 10)}
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
