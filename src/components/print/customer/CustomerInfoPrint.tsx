/**
 * Customer Info Print Section
 * Displays personal, contact, and address information for print
 */

import {
  formatPrintDate,
  formatPrintPhone,
  formatPrintAddress,
  formatFullName,
  maskSSN,
  maskPhone,
  calculateAge,
  formatPrintHeight,
  formatPrintWeight,
  getPrintStatusClass,
} from '@/utils/printUtils';

interface CustomerInfoPrintProps {
  customer: {
    id?: number;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name?: string;
    gender?: string;
    dateOfBirth?: string;
    ssn?: string;
    maritalStatus?: string;
    status?: string;
    joinDate?: string;
    email?: string;
    homePhone?: string;
    cellPhone?: string;
    workPhone?: string;
    fax?: string;
    address?: string;
    apartment?: string;
    apartmentType?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    differentMailingAddress?: boolean;
    mailingAddress?: string;
    mailingApartment?: string;
    mailingApartmentType?: string;
    mailingCity?: string;
    mailingState?: string;
    mailingZipCode?: string;
    height?: string;
    weight?: string | number;
    smoker?: string;
    referral?: string;
  };
  canViewSensitive?: boolean;
}

export const CustomerInfoPrint = ({ customer, canViewSensitive = false }: CustomerInfoPrintProps) => {
  const fullName = formatFullName(customer.firstName, customer.middleName, customer.lastName) || customer.name || 'Unknown';
  const age = calculateAge(customer.dateOfBirth);
  
  return (
    <>
      {/* Personal Information */}
      <div className="print-section no-break">
        <h3 className="print-section-title">Personal Information</h3>
        <div className="print-grid">
          <div className="print-info-row">
            <span className="print-info-label">First:</span>
            <span className="print-info-value highlight">{customer.firstName || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Middle:</span>
            <span className="print-info-value">{customer.middleName || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Last:</span>
            <span className="print-info-value highlight">{customer.lastName || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Gender:</span>
            <span className="print-info-value">{customer.gender || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">D.O.B:</span>
            <span className="print-info-value highlight">{formatPrintDate(customer.dateOfBirth)}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Age:</span>
            <span className="print-info-value highlight">{age !== null ? age : 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Marital:</span>
            <span className="print-info-value">{customer.maritalStatus || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Status:</span>
            <span className="print-info-value">
              <span className={`print-badge ${getPrintStatusClass(customer.status || '')}`}>
                {customer.status || 'N/A'}
              </span>
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">SSN:</span>
            <span className="print-info-value highlight">
              {canViewSensitive ? customer.ssn || 'N/A' : maskSSN(customer.ssn)}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Reg:</span>
            <span className="print-info-value">{formatPrintDate(customer.joinDate)}</span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="print-section no-break">
        <h3 className="print-section-title">Contact Information</h3>
        <div className="print-grid">
          <div className="print-info-row">
            <span className="print-info-label">Email:</span>
            <span className="print-info-value">{customer.email || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Home:</span>
            <span className="print-info-value highlight">
              {canViewSensitive 
                ? formatPrintPhone(customer.homePhone) 
                : customer.homePhone ? maskPhone(customer.homePhone) : 'N/A'}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Cell:</span>
            <span className="print-info-value">
              {canViewSensitive 
                ? formatPrintPhone(customer.cellPhone) 
                : customer.cellPhone ? maskPhone(customer.cellPhone) : 'N/A'}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Work:</span>
            <span className="print-info-value">{formatPrintPhone(customer.workPhone)}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Fax:</span>
            <span className="print-info-value">{formatPrintPhone(customer.fax)}</span>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="print-section no-break">
        <h3 className="print-section-title">Address</h3>
        <div className="print-grid">
          <div className="print-info-row print-full-width">
            <span className="print-info-label">Address:</span>
            <span className="print-info-value highlight">
              {formatPrintAddress(
                customer.address,
                customer.apartment,
                customer.apartmentType,
                customer.city,
                customer.state,
                customer.zipCode
              )}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">City:</span>
            <span className="print-info-value highlight">{customer.city || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">State:</span>
            <span className="print-info-value highlight">{customer.state || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Zip Code:</span>
            <span className="print-info-value highlight">{customer.zipCode || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Mailing Address:</span>
            <span className="print-info-value">
              {customer.differentMailingAddress
                ? formatPrintAddress(
                    customer.mailingAddress,
                    customer.mailingApartment,
                    customer.mailingApartmentType,
                    customer.mailingCity,
                    customer.mailingState,
                    customer.mailingZipCode
                  )
                : 'Same'}
            </span>
          </div>
        </div>
      </div>

      {/* Physical Details (if available) */}
      {(customer.height || customer.weight || customer.smoker) && (
        <div className="print-section no-break">
          <h3 className="print-section-title">Physical Details</h3>
          <div className="print-grid">
            <div className="print-info-row">
              <span className="print-info-label">Height:</span>
              <span className="print-info-value">{formatPrintHeight(customer.height)}</span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Weight:</span>
              <span className="print-info-value">{formatPrintWeight(customer.weight)}</span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Smoker:</span>
              <span className="print-info-value">{customer.smoker || 'N/A'}</span>
            </div>
            <div className="print-info-row">
              <span className="print-info-label">Referral:</span>
              <span className="print-info-value">{customer.referral || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerInfoPrint;
