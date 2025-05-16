import React from 'react';
import { useParams, Link } from 'react-router-dom';
import InvoiceForm from '../components/InvoiceForm';
import { templates } from './LandingPage';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const CreateInvoicePage = ({ onInvoiceCreated }) => {
  const { templateId } = useParams();
  const { user } = useAuth(); // Get authenticated user details

  const selectedTemplate = templates.find(t => t.id === templateId);

  if (!selectedTemplate) {
    return (
      <div>
        <h2>Template Not Found</h2>
        <p>The selected invoice template ID '{templateId}' is invalid.</p>
        <Link to="/">Go back to Templates</Link>
      </div>
    );
  }

  // Prepare company details from the authenticated user
  const companyDetailsFromAuth = user ? {
    companyName: user.organizationName,
    companyAddress: user.companyAddress,
    companyEmail: user.companyEmail,
    companyPhone: user.companyPhone,
  } : {};

  return (
    <div>
      <h2>Create Invoice - {selectedTemplate.name}</h2>
      <InvoiceForm
        onInvoiceCreated={onInvoiceCreated}
        template={selectedTemplate}
        initialCompanyDetails={companyDetailsFromAuth} // Pass company details
      />
    </div>
  );
};

export default CreateInvoicePage;
