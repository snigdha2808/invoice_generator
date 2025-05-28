import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link
import InvoiceList from '../components/InvoiceList';

// Assuming your backend runs on port 5001
const API_URL = 'http://65.0.19.202:5001/api/invoices';

const ViewInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  // Fetch invoices on initial load and when searchTerm changes
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError('');
        let url = API_URL;
        if (searchTerm) {
          url += `?clientName=${encodeURIComponent(searchTerm)}`;
        }
        const response = await axios.get(url); 
        setInvoices(response.data); 
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to fetch invoices. Is the server running?');
      } finally {
        setLoading(false);
      }
    };

    // Debounce fetching
    const debounceTimeout = setTimeout(() => {
      fetchInvoices();
    }, 500); // Fetch after 500ms of inactivity

    return () => clearTimeout(debounceTimeout); // Cleanup timeout on unmount or if searchTerm changes quickly

  }, [searchTerm]); // Runs on component mount and when searchTerm changes


  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Search Input */}
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>My Invoices</h2>
      <h4 style={{ marginBottom: '10px', color: '#555' }}>Search by client name</h4>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '100%', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Loading invoices...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {!loading && !error && <InvoiceList invoices={invoices} />} 
    </div>
  );
};

export default ViewInvoicesPage;
