import React from 'react';
import { InsuranceProductsManagement } from './InsuranceProductsManagement';

// Demo component to showcase the card view feature
export function InsuranceProductsDemo() {
  // Mock data for demonstration
  const mockCompanies = [
    { id: 1, name: 'ABC Insurance Co.', code: 'ABC', is_active: true },
    { id: 2, name: 'XYZ Insurance Group', code: 'XYZ', is_active: true },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Insurance Products Management</h1>
        <p className="text-gray-600">
          Now features both card and table view modes! Use the toggle buttons to switch between views.
        </p>
      </div>
      
      <InsuranceProductsManagement 
        companies={mockCompanies}
        selectedCompany={mockCompanies[0]}
      />
    </div>
  );
}

export default InsuranceProductsDemo;
