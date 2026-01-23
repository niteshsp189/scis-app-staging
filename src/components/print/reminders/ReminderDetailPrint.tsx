/**
 * Single Reminder Detail Print Component
 * Displays comprehensive reminder information for printing
 */

import { Reminder } from '@/services/reminderService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

interface ReminderDetailPrintProps {
  reminder: Reminder;
}

export const ReminderDetailPrint = ({ reminder }: ReminderDetailPrintProps) => {
  // Helper to check if overdue
  const isOverdue = (): boolean => {
    return (
      new Date(reminder.reminder_datetime) < new Date() &&
      reminder.status === 'pending'
    );
  };

  // Helper to get contact info
  const getContactInfo = () => {
    if (reminder.customer) {
      return {
        type: 'Customer',
        name: `${reminder.customer.first_name} ${reminder.customer.last_name}`,
        email: reminder.customer.email,
        phone: reminder.customer.phone,
      };
    }
    if (reminder.lead) {
      return {
        type: 'Lead',
        name: `${reminder.lead.first_name} ${reminder.lead.last_name}`,
        email: reminder.lead.email,
        phone: reminder.lead.phone,
      };
    }
    return null;
  };

  const contactInfo = getContactInfo();
  const overdueStatus = isOverdue();

  // Section style
  const sectionStyle = {
    marginBottom: '24px',
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 600 as const,
    color: '#374151',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '2px solid #e5e7eb',
  };

  const rowStyle = {
    display: 'flex',
    marginBottom: '8px',
    fontSize: '12px',
  };

  const labelStyle = {
    width: '140px',
    fontWeight: 500 as const,
    color: '#6b7280',
    flexShrink: 0,
  };

  const valueStyle = {
    color: '#111827',
    flex: 1,
  };

  return (
    <div>
      {/* Main Reminder Info */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Reminder Information</div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Title:</div>
          <div style={{ ...valueStyle, fontWeight: 600, fontSize: '14px' }}>
            {reminder.title}
          </div>
        </div>

        {reminder.description && (
          <div style={rowStyle}>
            <div style={labelStyle}>Description:</div>
            <div style={valueStyle}>{reminder.description}</div>
          </div>
        )}

        <div style={rowStyle}>
          <div style={labelStyle}>Due Date:</div>
          <div style={valueStyle}>
            {formatPrintDate(reminder.reminder_datetime)} at {formatPrintTime(reminder.reminder_datetime)}
          </div>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>Status:</div>
          <div style={valueStyle}>
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: overdueStatus 
                ? '#fee2e2' 
                : reminder.status === 'completed' 
                  ? '#dcfce7' 
                  : '#fef3c7',
              color: overdueStatus 
                ? '#dc2626' 
                : reminder.status === 'completed' 
                  ? '#16a34a' 
                  : '#d97706',
            }}>
              {overdueStatus ? 'OVERDUE' : reminder.status.toUpperCase()}
            </span>
          </div>
        </div>

        {reminder.reminder_type && (
          <div style={rowStyle}>
            <div style={labelStyle}>Type:</div>
            <div style={valueStyle}>
              {reminder.reminder_type.charAt(0).toUpperCase() + reminder.reminder_type.slice(1).replace(/_/g, ' ')}
            </div>
          </div>
        )}

        {reminder.is_recurring && (
          <>
            <div style={rowStyle}>
              <div style={labelStyle}>Recurring:</div>
              <div style={valueStyle}>Yes</div>
            </div>
            {reminder.recurring_pattern && (
              <div style={rowStyle}>
                <div style={labelStyle}>Pattern:</div>
                <div style={valueStyle}>{reminder.recurring_pattern}</div>
              </div>
            )}
            {reminder.recurring_end_date && (
              <div style={rowStyle}>
                <div style={labelStyle}>Ends On:</div>
                <div style={valueStyle}>{formatPrintDate(reminder.recurring_end_date)}</div>
              </div>
            )}
          </>
        )}

        {reminder.notification_methods && reminder.notification_methods.length > 0 && (
          <div style={rowStyle}>
            <div style={labelStyle}>Notifications:</div>
            <div style={valueStyle}>
              {reminder.notification_methods.map(m => m.toUpperCase()).join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {contactInfo && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Contact Information</div>
          
          <div style={rowStyle}>
            <div style={labelStyle}>Type:</div>
            <div style={valueStyle}>{contactInfo.type}</div>
          </div>

          <div style={rowStyle}>
            <div style={labelStyle}>Name:</div>
            <div style={valueStyle}>{contactInfo.name}</div>
          </div>

          {contactInfo.email && (
            <div style={rowStyle}>
              <div style={labelStyle}>Email:</div>
              <div style={valueStyle}>{contactInfo.email}</div>
            </div>
          )}

          {contactInfo.phone && (
            <div style={rowStyle}>
              <div style={labelStyle}>Phone:</div>
              <div style={valueStyle}>{contactInfo.phone}</div>
            </div>
          )}
        </div>
      )}

      {/* Related Policy */}
      {reminder.policy && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Related Policy</div>
          
          <div style={rowStyle}>
            <div style={labelStyle}>Policy Number:</div>
            <div style={valueStyle}>{reminder.policy.policy_number}</div>
          </div>

          <div style={rowStyle}>
            <div style={labelStyle}>Type:</div>
            <div style={valueStyle}>{reminder.policy.type}</div>
          </div>
        </div>
      )}

      {/* Related Appointment */}
      {reminder.appointment && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Related Appointment</div>
          
          <div style={rowStyle}>
            <div style={labelStyle}>Title:</div>
            <div style={valueStyle}>{reminder.appointment.title}</div>
          </div>

          <div style={rowStyle}>
            <div style={labelStyle}>Date/Time:</div>
            <div style={valueStyle}>
              {formatPrintDate(reminder.appointment.start_time)} at {formatPrintTime(reminder.appointment.start_time)}
              {reminder.appointment.end_time && (
                <> — {formatPrintTime(reminder.appointment.end_time)}</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Information */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Assignment & Tracking</div>
        
        {reminder.assigned_user && (
          <div style={rowStyle}>
            <div style={labelStyle}>Assigned To:</div>
            <div style={valueStyle}>
              {reminder.assigned_user.first_name} {reminder.assigned_user.last_name}
              {reminder.assigned_user.email && (
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  ({reminder.assigned_user.email})
                </span>
              )}
            </div>
          </div>
        )}

        {reminder.agent && !reminder.assigned_user && (
          <div style={rowStyle}>
            <div style={labelStyle}>Agent:</div>
            <div style={valueStyle}>
              {reminder.agent.first_name} {reminder.agent.last_name}
              {reminder.agent.email && (
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  ({reminder.agent.email})
                </span>
              )}
            </div>
          </div>
        )}

        {reminder.creator && (
          <div style={rowStyle}>
            <div style={labelStyle}>Created By:</div>
            <div style={valueStyle}>
              {reminder.creator.first_name} {reminder.creator.last_name}
            </div>
          </div>
        )}

        <div style={rowStyle}>
          <div style={labelStyle}>Created At:</div>
          <div style={valueStyle}>
            {formatPrintDate(reminder.created_at)} at {formatPrintTime(reminder.created_at)}
          </div>
        </div>

        {reminder.updated_at && reminder.updated_at !== reminder.created_at && (
          <div style={rowStyle}>
            <div style={labelStyle}>Last Updated:</div>
            <div style={valueStyle}>
              {formatPrintDate(reminder.updated_at)} at {formatPrintTime(reminder.updated_at)}
            </div>
          </div>
        )}
      </div>

      {/* Notification Status */}
      {(reminder.email_status || reminder.sms_status || reminder.push_status) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Notification Status</div>
          
          {reminder.email_status && (
            <div style={rowStyle}>
              <div style={labelStyle}>Email:</div>
              <div style={valueStyle}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  backgroundColor: reminder.email_status === 'sent' ? '#dcfce7' : '#f3f4f6',
                  color: reminder.email_status === 'sent' ? '#16a34a' : '#6b7280',
                }}>
                  {reminder.email_status.toUpperCase()}
                </span>
                {reminder.email_sent_at && (
                  <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                    at {formatPrintDate(reminder.email_sent_at)} {formatPrintTime(reminder.email_sent_at)}
                  </span>
                )}
              </div>
            </div>
          )}

          {reminder.sms_status && (
            <div style={rowStyle}>
              <div style={labelStyle}>SMS:</div>
              <div style={valueStyle}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  backgroundColor: reminder.sms_status === 'sent' || reminder.sms_status === 'delivered' 
                    ? '#dcfce7' 
                    : '#f3f4f6',
                  color: reminder.sms_status === 'sent' || reminder.sms_status === 'delivered' 
                    ? '#16a34a' 
                    : '#6b7280',
                }}>
                  {reminder.sms_status.toUpperCase()}
                </span>
                {reminder.sms_sent_at && (
                  <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                    at {formatPrintDate(reminder.sms_sent_at)} {formatPrintTime(reminder.sms_sent_at)}
                  </span>
                )}
              </div>
            </div>
          )}

          {reminder.push_status && (
            <div style={rowStyle}>
              <div style={labelStyle}>Push:</div>
              <div style={valueStyle}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  backgroundColor: reminder.push_status === 'sent' || reminder.push_status === 'delivered' 
                    ? '#dcfce7' 
                    : '#f3f4f6',
                  color: reminder.push_status === 'sent' || reminder.push_status === 'delivered' 
                    ? '#16a34a' 
                    : '#6b7280',
                }}>
                  {reminder.push_status.toUpperCase()}
                </span>
                {reminder.push_sent_at && (
                  <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                    at {formatPrintDate(reminder.push_sent_at)} {formatPrintTime(reminder.push_sent_at)}
                  </span>
                )}
              </div>
            </div>
          )}

          {reminder.failure_reason && (
            <div style={rowStyle}>
              <div style={labelStyle}>Failure Reason:</div>
              <div style={{ ...valueStyle, color: '#dc2626' }}>
                {reminder.failure_reason}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderDetailPrint;
