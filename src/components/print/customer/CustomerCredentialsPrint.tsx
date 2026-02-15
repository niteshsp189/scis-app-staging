/**
 * Customer Credentials Print Section
 * Displays medicare info, banking details, and medications
 */

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface CustomerCredentialsPrintProps {
  credentials: {
    medicare_number?: string;
    bank_account_type?: string;
    routing_number?: string;
    account_number?: string;
    medicare_gov_username?: string;
    medicare_gov_password?: string;
    medications?: Medication[];
  };
  canViewSensitive?: boolean;
}

const maskAccountNumber = (accountNumber: string | undefined): string => {
  if (!accountNumber) return 'N/A';
  if (accountNumber.length <= 4) return '*'.repeat(accountNumber.length);
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};

const maskRoutingNumber = (routingNumber: string | undefined): string => {
  if (!routingNumber) return 'N/A';
  if (routingNumber.length <= 4) return '*'.repeat(routingNumber.length);
  return '*'.repeat(routingNumber.length - 4) + routingNumber.slice(-4);
};

export const CustomerCredentialsPrint = ({
  credentials,
  canViewSensitive = false,
}: CustomerCredentialsPrintProps) => {
  const hasMedicareInfo = credentials.medicare_number ||
    credentials.medicare_gov_username ||
    credentials.medicare_gov_password;

  const hasBankingInfo = credentials.bank_account_type ||
    credentials.routing_number ||
    credentials.account_number;

  const hasMedications = credentials.medications && credentials.medications.length > 0;

  if (!hasMedicareInfo && !hasBankingInfo && !hasMedications) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">Credentials</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No credentials information found.</p>
      </div>
    );
  }

  return (
    <div className="print-section">
      <h3 className="print-section-title">Credentials</h3>

      {/* Medicare Information */}
      {hasMedicareInfo && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
            Medicare Information
          </div>
          <div className="print-grid">
            <div className="print-info-row">
              <span className="print-info-label">Medicare Number:</span>
              <span className="print-info-value">
                {credentials.medicare_number || 'N/A'}
              </span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Medicare.gov Username:</span>
              <span className="print-info-value">
                {credentials.medicare_gov_username || 'N/A'}
              </span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Medicare.gov Password:</span>
              <span className="print-info-value">
                {canViewSensitive
                  ? (credentials.medicare_gov_password || 'N/A')
                  : (credentials.medicare_gov_password ? '********' : 'N/A')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Banking Information */}
      {hasBankingInfo && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
            Banking Information
          </div>
          <div className="print-grid">
            <div className="print-info-row">
              <span className="print-info-label">Account Type:</span>
              <span className="print-info-value">
                {credentials.bank_account_type || 'N/A'}
              </span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Routing Number:</span>
              <span className="print-info-value">
                {canViewSensitive
                  ? (credentials.routing_number || 'N/A')
                  : maskRoutingNumber(credentials.routing_number)}
              </span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Account Number:</span>
              <span className="print-info-value">
                {canViewSensitive
                  ? (credentials.account_number || 'N/A')
                  : maskAccountNumber(credentials.account_number)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Medications */}
      {hasMedications && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
            Medications
          </div>
          <div className="print-table-wrapper">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {credentials.medications!.map((medication, index) => (
                  <tr key={index}>
                    <td>{medication.name}</td>
                    <td>{medication.dosage}</td>
                    <td>{medication.frequency}</td>
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

export default CustomerCredentialsPrint;
