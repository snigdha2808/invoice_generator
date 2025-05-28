import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './ViewInvoicePage.module.css'; // We'll create this CSS module next

const ViewInvoicePage = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Assuming your templates are accessible, e.g., from a shared config or fetched
  // For now, let's define a placeholder or fetch them if needed.
  // This is important if extraFields depend on the template.
  const [template, setTemplate] = useState(null);


  // Placeholder for templates - ideally, this comes from a shared source
  const templates = [
    {
      id: 'classic-professional',
      name: 'Classic Professional',
      extraFields: [
        { id: 'purchaseOrder', label: 'Purchase Order #', type: 'text' },
        { id: 'projectCode', label: 'Project Code', type: 'text' },
      ]
    },
    {
      id: 'modern-sleek',
      name: 'Modern Sleek',
      extraFields: [
        { id: 'vatNumber', label: 'VAT Number', type: 'text' },
      ]
    },
    {
      id: 'compact-minimalist',
      name: 'Compact Minimalist',
      extraFields: []
    },
  ];


  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`http://65.0.19.202:5001/api/invoices/${invoiceId}`);
        setInvoice(response.data);
        // Find and set the template used for this invoice
        const foundTemplate = templates.find(t => t.id === response.data.templateId);
        setTemplate(foundTemplate);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        setError('Failed to load invoice details. Please try again later.');
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  if (loading) {
    return <div className={styles.statusMessage}>Loading invoice details...</div>;
  }

  if (error) {
    return <div className={`${styles.statusMessage} ${styles.errorMessage}`}>{error}</div>;
  }

  if (!invoice) {
    return <div className={styles.statusMessage}>Invoice not found.</div>;
  }

  const calculateLineItemTotal = (item) => {
    return (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2);
  };

  return (
    <div className={styles.viewInvoiceContainer}>
      <div className={styles.headerActions}>
        <Link to="/invoices" className={styles.backButton}>
          &larr; Back to Invoices
        </Link>
        {/* Add Print/Download PDF button here if desired later */}
      </div>

      <h1 className={styles.pageTitle}>Invoice Details</h1>
      
      <div className={styles.invoicePaper}>
        <div className={styles.invoiceHeader}>
          <div className={styles.companyDetails}>
            <h2>{invoice.companyName || 'Your Company'}</h2>
            <p>{invoice.companyAddress || '123 Business Rd, City, State'}</p>
            <p>{invoice.companyEmail || 'contact@yourcompany.com'}</p>
            <p>{invoice.companyPhone || '+1-234-567-8900'}</p>
          </div>
          <div className={styles.invoiceInfo}>
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Date of Issue:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <div className={styles.clientDetails}>
          <h3>Bill To:</h3>
          <p><strong>{invoice.clientName}</strong></p>
          <p>{invoice.clientAddress}</p>
          <p>{invoice.clientEmail}</p>
        </div>

        {/* Display Template-Specific Extra Fields */}
        {template && template.extraFields && template.extraFields.length > 0 && (
          <div className={styles.extraFieldsSection}>
            <h3>Additional Information:</h3>
            {template.extraFields.map(field => (
              invoice.templateData && invoice.templateData[field.id] && (
                <p key={field.id}>
                  <strong>{field.label}:</strong> {invoice.templateData[field.id]}
                </p>
              )
            ))}
          </div>
        )}

        <div className={styles.lineItemsSection}>
          <h3>Items:</h3>
          <table className={styles.lineItemsTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems && invoice.lineItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>₹{parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td>₹{calculateLineItemTotal(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.invoiceTotals}>
          <p><strong>Subtotal:</strong> ₹{invoice.subTotal ? invoice.subTotal.toFixed(2) : '0.00'}</p>
          <p><strong>Tax ({invoice.taxRate !== undefined ? invoice.taxRate : 0}%):</strong> ₹{invoice.taxAmount ? invoice.taxAmount.toFixed(2) : '0.00'}</p>
          <p><strong>Total Amount:</strong> ₹{invoice.totalAmount ? invoice.totalAmount.toFixed(2) : '0.00'}</p>
        </div>

        {invoice.notes && (
          <div className={styles.notesSection}>
            <h3>Notes:</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInvoicePage;
