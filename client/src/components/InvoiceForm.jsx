import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LineItemInput from './LineItemInput'; 

const API_URL = 'http://65.0.19.202:5001/api/invoices';

const InvoiceForm = ({ onInvoiceCreated, template, initialCompanyDetails }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    companyName: initialCompanyDetails?.companyName || '', // From auth user
    companyAddress: initialCompanyDetails?.companyAddress || '', // From auth user
    companyEmail: initialCompanyDetails?.companyEmail || '', // From auth user
    companyPhone: initialCompanyDetails?.companyPhone || '', // From auth user
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 0, // Added taxRate
    notes: '',
    extraData: {},
  });

  // useEffect should be inside the component function body
  useEffect(() => {
    if (template && template.extraFields) {
      const initialExtraData = {};
      template.extraFields.forEach(field => {
        initialExtraData[field.id] = '';
      });
      setFormData(prevData => ({
        ...prevData,
        companyName: initialCompanyDetails?.companyName || prevData.companyName || '',
        companyAddress: initialCompanyDetails?.companyAddress || prevData.companyAddress || '',
        companyEmail: initialCompanyDetails?.companyEmail || prevData.companyEmail || '',
        companyPhone: initialCompanyDetails?.companyPhone || prevData.companyPhone || '',
        extraData: initialExtraData,
      }));
    } else {
      // Ensure company details are set even if no template extra fields
      setFormData(prevData => ({
        ...prevData,
        companyName: initialCompanyDetails?.companyName || prevData.companyName || '',
        companyAddress: initialCompanyDetails?.companyAddress || prevData.companyAddress || '',
        companyEmail: initialCompanyDetails?.companyEmail || prevData.companyEmail || '',
        companyPhone: initialCompanyDetails?.companyPhone || prevData.companyPhone || '',
      }));
    }
  }, [template, initialCompanyDetails]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('extraData.')) {
      const fieldId = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        extraData: {
          ...prevData.extraData,
          [fieldId]: value
        }
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };


  const handleLineItemChange = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    const numericValue = (field === 'quantity' || field === 'unitPrice') ? parseFloat(value) || 0 : value;
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: numericValue,
    };
    setFormData({ ...formData, lineItems: updatedLineItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeLineItem = (index) => {
    const updatedLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: updatedLineItems });
  };

  const calculateSubTotal = () => {
    return formData.lineItems.reduce((sub, item) => {
      // Ensure quantity and unitPrice are numbers before multiplying
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sub + (quantity * unitPrice);
    }, 0);
  };

  const calculateTaxAmount = (subTotal) => {
    const taxRate = parseFloat(formData.taxRate) || 0;
    return subTotal * (taxRate / 100);
  };

  const calculateGrandTotal = (subTotal, taxAmount) => {
    return subTotal + taxAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.clientName || !formData.invoiceNumber || formData.lineItems.length === 0) {
      setError('Please fill in Client Name, Invoice Number, and add at least one line item.');
      return;
    }

    const subTotal = calculateSubTotal();
    const taxAmount = calculateTaxAmount(subTotal);
    const totalAmount = calculateGrandTotal(subTotal, taxAmount);

    const invoiceData = {
      ...formData, // Includes companyName, companyAddress, etc. from state
      templateId: template.id,
      lineItems: formData.lineItems.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
      })),
      subTotal: parseFloat(subTotal.toFixed(2)),
      taxRate: parseFloat(formData.taxRate) || 0,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };

    try {
      // The backend route is POST /api/invoices, not /api/invoices/create
      const response = await axios.post(API_URL, invoiceData);
      console.log(response.data, 'response.data');
      setSuccess(`Invoice ${response.data.invoiceNumber} created successfully!`);
      if (onInvoiceCreated) {
        onInvoiceCreated(response.data); 
      }
    } catch (err) {
      console.error('Error creating invoice:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.msg || 'Failed to create invoice. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} /* style={{ maxWidth: '800px', margin: '20px auto' }} - Use App.css styles */ >
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <h3>Your Company Information (Auto-filled)</h3>
      <div>
        <label htmlFor="companyName">Company Name:</label>
        <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="companyAddress">Company Address:</label>
        <textarea id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange}></textarea>
      </div>
      <div>
        <label htmlFor="companyEmail">Company Email:</label>
        <input type="email" id="companyEmail" name="companyEmail" value={formData.companyEmail} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="companyPhone">Company Phone:</label>
        <input type="text" id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} />
      </div>

      <h3>Client Information</h3>
      <div>
        <label htmlFor="clientName">Client Name:</label>
        <input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="clientEmail">Client Email:</label>
        <input type="email" id="clientEmail" name="clientEmail" value={formData.clientEmail} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="clientAddress">Client Address:</label>
        <textarea id="clientAddress" name="clientAddress" value={formData.clientAddress} onChange={handleChange}></textarea>
      </div>

      <h3>Invoice Details</h3>
      <div>
        <label htmlFor="invoiceNumber">Invoice Number:</label>
        <input type="text" id="invoiceNumber" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="issueDate">Issue Date:</label>
        <input type="date" id="issueDate" name="issueDate" value={formData.issueDate} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="dueDate">Due Date:</label>
        <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} />
      </div>

      <h3>Line Items</h3>
      {formData.lineItems.map((item, index) => (
        <LineItemInput
          key={index}
          index={index}
          item={item}
          onLineItemChange={handleLineItemChange}
          onRemoveLineItem={removeLineItem}
        />
      ))}
      <button type="button" onClick={addLineItem} style={{ marginTop: '10px', marginBottom: '20px' }}>
        Add Line Item
      </button>

      {/* Tax Rate Input */}
      <div style={{ marginTop: '20px' }}>
        <label htmlFor="taxRate">Tax Rate (%):</label>
        <input
          type="number"
          id="taxRate"
          name="taxRate"
          value={formData.taxRate}
          onChange={handleChange}
          step="0.01"
          min="0"
        />
      </div>

      {/* Display Calculated Totals */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <h4>Subtotal: ₹{calculateSubTotal().toFixed(2)}</h4>
        <h4>Tax: ₹{calculateTaxAmount(calculateSubTotal()).toFixed(2)}</h4>
        <h3>Total: ₹{calculateGrandTotal(calculateSubTotal(), calculateTaxAmount(calculateSubTotal())).toFixed(2)}</h3>
      </div>

      {template && template.extraFields && template.extraFields.length > 0 && (
        <>
          <h3>Additional Information ({template.name})</h3>
          {template.extraFields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id}>{field.label}:</label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.id}
                  name={`extraData.${field.id}`} 
                  value={formData.extraData[field.id] || ''}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type={field.type}
                  id={field.id}
                  name={`extraData.${field.id}`} 
                  value={formData.extraData[field.id] || ''}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
        </>
      )}


      <h3>Notes</h3>
      <div>
        <label htmlFor="notes">Notes (optional):</label>
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}></textarea>
      </div>

      <div style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '1.2em' }}>
        Total Amount: ₹{calculateGrandTotal(calculateSubTotal(), calculateTaxAmount(calculateSubTotal())).toFixed(2)}
      </div>

      <button type="submit" style={{ marginTop: '20px', padding: '10px 20px' }}>
        Create Invoice
      </button>
    </form>
  );
};

export default InvoiceForm;
