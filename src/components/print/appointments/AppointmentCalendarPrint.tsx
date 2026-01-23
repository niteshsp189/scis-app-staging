/**
 * Appointment Calendar Print Component
 * Displays appointments in a calendar grid format for printing
 */

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { Appointment } from '@/services/appointmentService';

interface AppointmentCalendarPrintProps {
  appointments: Appointment[];
  year: number;
  month: number;
  filters?: {
    status?: string;
    type?: string;
    assignedTo?: string;
    assignedToName?: string;
    location?: string;
  };
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    new_client: '#22c55e',
    supplement: '#3b82f6',
    part_d: '#8b5cf6',
    rate_increase: '#f59e0b',
    under_65: '#06b6d4',
    dental_vision: '#ec4899',
    review: '#14b8a6',
    customer_service: '#6366f1',
    field_time: '#84cc16',
    life_insurance: '#f97316',
    meeting: '#64748b',
    call: '#0ea5e9',
    presentation: '#a855f7',
    follow_up: '#eab308',
    consultation: '#10b981',
    quote: '#f472b6',
    other: '#94a3b8',
  };
  return colors[type] || '#94a3b8';
};

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    new_client: 'New',
    supplement: 'Supp',
    part_d: 'PD',
    rate_increase: 'Rate',
    under_65: 'U65',
    dental_vision: 'D/V',
    review: 'Rev',
    customer_service: 'CS',
    field_time: 'Field',
    life_insurance: 'Life',
    meeting: 'Mtg',
    call: 'Call',
    presentation: 'Pres',
    follow_up: 'F/U',
    consultation: 'Cons',
    quote: 'Quote',
    other: 'Other',
  };
  return labels[type] || type;
};

const formatTime = (datetime: string): string => {
  try {
    const date = parseISO(datetime);
    return format(date, 'h:mma').toLowerCase();
  } catch {
    return '';
  }
};

export const AppointmentCalendarPrint = ({
  appointments,
  year,
  month,
  filters,
}: AppointmentCalendarPrintProps) => {
  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Build calendar grid
  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Group appointments by date
  const appointmentsByDate = new Map<string, Appointment[]>();
  appointments.forEach((apt) => {
    const dateKey = apt.start_datetime.split('T')[0];
    if (!appointmentsByDate.has(dateKey)) {
      appointmentsByDate.set(dateKey, []);
    }
    appointmentsByDate.get(dateKey)!.push(apt);
  });

  // Sort appointments within each day by time
  appointmentsByDate.forEach((dayApts) => {
    dayApts.sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
  });

  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="print-calendar-section">
      {/* Filter Summary */}
      {filters && Object.keys(filters).some(k => filters[k as keyof typeof filters]) && (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          padding: '8px 12px',
          marginBottom: '15px',
          fontSize: '9pt',
        }}>
          <strong>Filters:</strong>
          {filters.assignedToName && (
            <span style={{ marginLeft: '10px' }}>
              For: {filters.assignedToName}
            </span>
          )}
          {filters.status && filters.status !== 'all' && (
            <span style={{ marginLeft: '10px' }}>
              Status: {filters.status}
            </span>
          )}
          {filters.type && filters.type !== 'all' && (
            <span style={{ marginLeft: '10px' }}>
              Type: {filters.type}
            </span>
          )}
        </div>
      )}

      {/* Month Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '9pt',
        color: '#6b7280',
      }}>
        <span>Total: <strong>{appointments.length}</strong> appointments</span>
      </div>

      {/* Calendar Grid */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #d1d5db',
        tableLayout: 'fixed',
      }}>
        {/* Day Headers */}
        <thead>
          <tr>
            {dayNames.map((dayName) => (
              <th key={dayName} style={{
                backgroundColor: '#f3f4f6',
                padding: '8px 4px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '10pt',
                borderBottom: '2px solid #d1d5db',
                width: `${100/7}%`,
              }}>
                {dayName}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((calDay) => {
                const dateKey = format(calDay, 'yyyy-MM-dd');
                const dayAppointments = appointmentsByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(calDay, monthDate);
                const isToday = isSameDay(calDay, new Date());

                return (
                  <td
                    key={dateKey}
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '4px',
                      verticalAlign: 'top',
                      height: '100px',
                      backgroundColor: isCurrentMonth ? (isToday ? '#eff6ff' : 'white') : '#f9fafb',
                    }}
                  >
                    {/* Day Number */}
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '11pt',
                      marginBottom: '4px',
                      color: isCurrentMonth ? (isToday ? '#2563eb' : '#111827') : '#9ca3af',
                      borderBottom: isToday ? '2px solid #2563eb' : 'none',
                      display: 'inline-block',
                      padding: isToday ? '0 4px' : '0',
                    }}>
                      {format(calDay, 'd')}
                    </div>

                    {/* Appointments for this day */}
                    <div style={{ fontSize: '7pt', lineHeight: '1.3' }}>
                      {dayAppointments.slice(0, 4).map((apt, idx) => (
                        <div
                          key={apt.id}
                          style={{
                            backgroundColor: getTypeColor(apt.appointment_type),
                            color: 'white',
                            padding: '1px 3px',
                            marginBottom: '2px',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <strong>{formatTime(apt.start_datetime)}</strong>{' '}
                          {apt.customer 
                            ? `${apt.customer.last_name}`
                            : apt.lead 
                            ? `${apt.lead.last_name}`
                            : getTypeLabel(apt.appointment_type)}
                        </div>
                      ))}
                      {dayAppointments.length > 4 && (
                        <div style={{
                          color: '#6b7280',
                          fontStyle: 'italic',
                          fontSize: '7pt',
                        }}>
                          +{dayAppointments.length - 4} more
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{
        marginTop: '15px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '8pt',
      }}>
        <strong>Legend:</strong>
        {[
          { type: 'new_client', label: 'New Client' },
          { type: 'supplement', label: 'Supplement' },
          { type: 'part_d', label: 'Part D' },
          { type: 'rate_increase', label: 'Rate Increase' },
          { type: 'review', label: 'Review' },
          { type: 'meeting', label: 'Meeting' },
          { type: 'call', label: 'Call' },
        ].map(({ type, label }) => (
          <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{
              width: '12px',
              height: '12px',
              backgroundColor: getTypeColor(type),
              borderRadius: '2px',
              display: 'inline-block',
            }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AppointmentCalendarPrint;
