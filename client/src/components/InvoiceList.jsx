import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './InvoiceList.module.css'; // Import CSS Module

const InvoiceList = ({ invoices, fetchInvoices }) => {

  const downloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      // Using /api proxy path set up in vite.config.js
      const response = await axios.get(`/api/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      URL.revokeObjectURL(fileURL);

    } catch (error) {
        console.error("Error downloading PDF:", error.response ? error.response.data : error.message);
        alert("Failed to download PDF. Please check the console for more details.");
    }
  };

  if (!invoices || invoices.length === 0) {
    return <p className={styles.noInvoicesMessage}>No invoices found. Create one to get started!</p>;
  }

  // Helper to get status style
  const getStatusClass = (status) => {
    if (status === 'Paid') return styles.statusPaid;
    if (status === 'Failed') return styles.statusFailed;
    return styles.statusPending; // Default to Pending
  };

  return (
    <div className={styles.invoiceListContainer}>
      <h2 className={styles.invoiceListTitle}>Saved Invoices</h2>
      <table className={styles.invoiceTable}>
        <thead>
          <tr className={styles.tableRow}> 
            <th className={styles.tableHeader}>Invoice #</th>
            <th className={styles.tableHeader}>Client Name</th>
            <th className={styles.tableHeader}>Issue Date</th>
            <th className={styles.tableHeader}>Due Date</th>
            <th className={styles.tableHeader}>Amount</th>
            <th className={styles.tableHeader}>Status</th>
            <th className={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id} className={styles.tableRow}>
              <td className={styles.tableCell}>{invoice.invoiceNumber}</td>
              <td className={styles.tableCell}>{invoice.clientName}</td>
              <td className={styles.tableCell}>{new Date(invoice.issueDate).toLocaleDateString()}</td>
              <td className={styles.tableCell}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
              <td className={styles.tableCell}>{invoice.totalAmount?.toFixed(2) || '0.00'}</td>
              <td className={styles.tableCell}>
                <span className={`${styles.statusBadge} ${getStatusClass(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus || 'Pending'}
                </span>
              </td>
              <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                <Link 
                  to={`/invoices/view/${invoice._id}`} 
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                >
                  View
                </Link>
                <button 
                  onClick={() => downloadPdf(invoice._id, invoice.invoiceNumber)} 
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
