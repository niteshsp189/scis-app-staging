/**
 * Single Call Detail Print Component
 * Displays comprehensive call information for printing
 */

import { CustomerActivity } from '@/services/customerActivitiesService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

interface CallDetailPrintProps {
  call: CustomerActivity;
  customerName?: string;
  answerCalls?: CustomerActivity[];
  parentCall?: CustomerActivity | null;
}

export const CallDetailPrint = ({ 
  call, 
  customerName,
  answerCalls = [],
  parentCall,
}: CallDetailPrintProps) => {
  // Helper to get user display
  const getUserDisplay = (user?: { first_name: string; last_name: string; email?: string }): string => {
    if (!user) return '—';
    return `${user.first_name} ${user.last_name}${user.email ? ` (${user.email})` : ''}`;
  };

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

  // Get forwarded user
  const forwardedToUser = (call as CustomerActivity & { forwarded_to_user?: { first_name: string; last_name: string; email?: string } }).forwarded_to_user 
    || call.forwardedToUser 
    || call.call_forwarded_to_user;

  return (
    <div>
      {/* Call Type Badge */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: call.activity_type === 'Incoming Call' 
            ? '#dcfce7' 
            : '#dbeafe',
          color: call.activity_type === 'Incoming Call' 
            ? '#16a34a' 
            : '#2563eb',
        }}>
          {call.activity_type === 'Incoming Call' ? '↓ Incoming Call' : '↑ Outgoing Call'}
        </span>
        {call.parent_activity_id && (
          <span style={{
            display: 'inline-block',
            marginLeft: '10px',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: '#ede9fe',
            color: '#7c3aed',
          }}>
            Answer Call
          </span>
        )}
      </div>

      {/* Main Call Info */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Call Information</div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Title:</div>
          <div style={{ ...valueStyle, fontWeight: 600, fontSize: '14px' }}>
            {call.title}
          </div>
        </div>

        {call.description && (
          <div style={rowStyle}>
            <div style={labelStyle}>Description:</div>
            <div style={valueStyle}>{call.description}</div>
          </div>
        )}

        <div style={rowStyle}>
          <div style={labelStyle}>Date:</div>
          <div style={valueStyle}>{formatPrintDate(call.activity_date)}</div>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>Time:</div>
          <div style={valueStyle}>{formatPrintTime(call.activity_time)}</div>
        </div>

        {call.duration_minutes > 0 && (
          <div style={rowStyle}>
            <div style={labelStyle}>Duration:</div>
            <div style={valueStyle}>{call.duration_minutes} minutes</div>
          </div>
        )}

        <div style={rowStyle}>
          <div style={labelStyle}>Status:</div>
          <div style={valueStyle}>
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: call.status === 'Completed' 
                ? '#dcfce7' 
                : call.status === 'Pending'
                  ? '#fef3c7'
                  : '#f3f4f6',
              color: call.status === 'Completed' 
                ? '#16a34a' 
                : call.status === 'Pending'
                  ? '#d97706'
                  : '#6b7280',
            }}>
              {call.status}
            </span>
          </div>
        </div>

        <div style={rowStyle}>
          <div style={labelStyle}>Priority:</div>
          <div style={valueStyle}>
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: call.priority === 'High' 
                ? '#fee2e2' 
                : call.priority === 'Medium'
                  ? '#fef3c7'
                  : '#dbeafe',
              color: call.priority === 'High' 
                ? '#dc2626' 
                : call.priority === 'Medium'
                  ? '#d97706'
                  : '#2563eb',
            }}>
              {call.priority}
            </span>
          </div>
        </div>

        {call.outcome && (
          <div style={rowStyle}>
            <div style={labelStyle}>Outcome:</div>
            <div style={valueStyle}>
              {call.outcome.charAt(0).toUpperCase() + call.outcome.slice(1).replace(/_/g, ' ')}
            </div>
          </div>
        )}
      </div>

      {/* Customer Information */}
      {customerName && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Customer Information</div>
          
          <div style={rowStyle}>
            <div style={labelStyle}>Customer:</div>
            <div style={valueStyle}>{customerName}</div>
          </div>
        </div>
      )}

      {/* People Involved */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>People Involved</div>
        
        {call.performer && (
          <div style={rowStyle}>
            <div style={labelStyle}>Performed By:</div>
            <div style={valueStyle}>{getUserDisplay(call.performer)}</div>
          </div>
        )}

        {(call.calledForUser || call.called_for_user) && (
          <div style={rowStyle}>
            <div style={labelStyle}>Called For:</div>
            <div style={valueStyle}>
              {getUserDisplay(call.calledForUser || call.called_for_user)}
            </div>
          </div>
        )}

        {forwardedToUser && (
          <div style={rowStyle}>
            <div style={labelStyle}>Forwarded To:</div>
            <div style={valueStyle}>{getUserDisplay(forwardedToUser)}</div>
          </div>
        )}

        {call.assignedUser && (
          <div style={rowStyle}>
            <div style={labelStyle}>Assigned To:</div>
            <div style={valueStyle}>{getUserDisplay(call.assignedUser)}</div>
          </div>
        )}
      </div>

      {/* Notes */}
      {call.notes && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Notes</div>
          <div style={{
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
          }}>
            {call.notes}
          </div>
        </div>
      )}

      {/* Follow-up Information */}
      {(call.follow_up_date || call.follow_up_notes) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Follow-up</div>
          
          {call.follow_up_date && (
            <div style={rowStyle}>
              <div style={labelStyle}>Follow-up Date:</div>
              <div style={valueStyle}>{formatPrintDate(call.follow_up_date)}</div>
            </div>
          )}

          {call.follow_up_notes && (
            <div style={rowStyle}>
              <div style={labelStyle}>Follow-up Notes:</div>
              <div style={valueStyle}>{call.follow_up_notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Parent Call (if this is an answer call) */}
      {parentCall && (
        <div style={sectionStyle}>
          <div style={{ ...sectionTitleStyle, color: '#2563eb' }}>Original Call</div>
          <div style={{
            padding: '16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
          }}>
            <div style={rowStyle}>
              <div style={labelStyle}>Type:</div>
              <div style={valueStyle}>{parentCall.activity_type}</div>
            </div>
            <div style={rowStyle}>
              <div style={labelStyle}>Title:</div>
              <div style={valueStyle}>{parentCall.title}</div>
            </div>
            <div style={rowStyle}>
              <div style={labelStyle}>Date/Time:</div>
              <div style={valueStyle}>
                {formatPrintDate(parentCall.activity_date)} at {formatPrintTime(parentCall.activity_time)}
              </div>
            </div>
            {parentCall.description && (
              <div style={rowStyle}>
                <div style={labelStyle}>Description:</div>
                <div style={valueStyle}>{parentCall.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answer Calls */}
      {answerCalls.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ ...sectionTitleStyle, color: '#16a34a' }}>
            Answer Calls ({answerCalls.length})
          </div>
          {answerCalls.map((answerCall, index) => (
            <div 
              key={answerCall.id}
              style={{
                padding: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                marginBottom: index < answerCalls.length - 1 ? '12px' : 0,
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#16a34a',
                marginBottom: '8px',
              }}>
                Answer Call #{index + 1}
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>Type:</div>
                <div style={valueStyle}>{answerCall.activity_type}</div>
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>Date/Time:</div>
                <div style={valueStyle}>
                  {formatPrintDate(answerCall.activity_date)} at {formatPrintTime(answerCall.activity_time)}
                </div>
              </div>
              {answerCall.description && (
                <div style={rowStyle}>
                  <div style={labelStyle}>Description:</div>
                  <div style={valueStyle}>{answerCall.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timestamps */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Record Information</div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Created:</div>
          <div style={valueStyle}>
            {formatPrintDate(call.created_at)} at {formatPrintTime(call.created_at)}
          </div>
        </div>

        {call.updated_at && call.updated_at !== call.created_at && (
          <div style={rowStyle}>
            <div style={labelStyle}>Last Updated:</div>
            <div style={valueStyle}>
              {formatPrintDate(call.updated_at)} at {formatPrintTime(call.updated_at)}
            </div>
          </div>
        )}

        {call.completed_at && (
          <div style={rowStyle}>
            <div style={labelStyle}>Completed At:</div>
            <div style={valueStyle}>
              {formatPrintDate(call.completed_at)} at {formatPrintTime(call.completed_at)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallDetailPrint;
