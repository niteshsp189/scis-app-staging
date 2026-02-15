
export const ActivityLogsSection = () => {
  const getAllLogs = () => [
    {
      id: "1",
      type: "Incoming Call",
      description: "Discussed policy renewal options and updated contact information. Customer interested in increasing coverage limits.",
      date: "2024-01-15",
      time: "10:30",
      followUpDate: "2024-01-30",
      createdBy: "Agent Smith",
      duration: "25 minutes",
      outcome: "Positive - Customer will consider options"
    },
    {
      id: "2",
      type: "Email",
      description: "Sent policy documents and renewal reminder with updated terms and conditions.",
      date: "2024-01-10",
      time: "14:15",
      createdBy: "Agent Smith",
      subject: "Policy Renewal Documents",
      outcome: "Documents delivered successfully"
    },
    {
      id: "3",
      type: "Meeting",
      description: "In-person consultation for family insurance planning. Reviewed all current policies and discussed additional coverage options.",
      date: "2024-01-05",
      time: "09:00",
      createdBy: "Agent Johnson",
      location: "Office Conference Room A",
      attendees: "Customer, Spouse, Agent Johnson",
      outcome: "Scheduled follow-up for next week"
    }
  ];

  return `
    <div class="section">
      <h3>Complete Activity Logs</h3>
      ${getAllLogs().map(log => `
        <div class="log-card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #1e40af;">${log.type} - ${new Date(log.date).toLocaleDateString('en-US', { timeZone: 'UTC' })} at ${log.time}</h4>
            <span class="badge badge-blue">${log.type}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span>${log.description}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Created By:</span>
            <span>${log.createdBy}</span>
          </div>
          ${log.duration ? `
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span>${log.duration}</span>
            </div>
          ` : ''}
          ${log.subject ? `
            <div class="detail-row">
              <span class="detail-label">Subject:</span>
              <span>${log.subject}</span>
            </div>
          ` : ''}
          ${log.location ? `
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span>${log.location}</span>
            </div>
          ` : ''}
          ${log.attendees ? `
            <div class="detail-row">
              <span class="detail-label">Attendees:</span>
              <span>${log.attendees}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Outcome:</span>
            <span>${log.outcome}</span>
          </div>
          ${log.followUpDate ? `
            <div style="margin-top: 8px;">
              <span class="badge badge-yellow">Follow-up: ${new Date(log.followUpDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
};
