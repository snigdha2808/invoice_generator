import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import { useAuth } from '../context/AuthContext';

// Define templates centrally, perhaps move to a separate constants file later
export const templates = [
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'A clean, traditional layout suitable for corporate clients.',
    thumbnailUrl: '/thumbnails/classic-professional.png', // Replace with actual path
    color: '#4a90e2', // Blue
    extraFields: [
      { id: 'purchaseOrder', label: 'Purchase Order #', type: 'text' },
      { id: 'projectCode', label: 'Project Code', type: 'text' },
    ]
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Simple and elegant design focusing on typography and whitespace.',
    thumbnailUrl: '/thumbnails/modern-minimalist.png', // Replace with actual path
    color: '#50e3c2', // Teal
    extraFields: [
      { id: 'clientNotes', label: 'Notes for Client', type: 'textarea' },
    ]
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    description: 'Uses color and a strong header for a vibrant look.',
    thumbnailUrl: '/thumbnails/creative-bold.png', // Replace with actual path
    color: '#f5a623', // Orange
    extraFields: [
      { id: 'discountCode', label: 'Discount Code', type: 'text' },
      { id: 'campaignName', label: 'Marketing Campaign', type: 'text' },
    ]
  },
  {
    id: 'simple-compact',
    name: 'Simple Compact',
    description: 'A space-saving design, good for invoices with few items.',
    thumbnailUrl: '/thumbnails/simple-compact.png', // Replace with actual path
    color: '#bd10e0', // Purple
    extraFields: [
      // No extra fields for this template
    ]
  },
  {
    id: 'formal-letterhead',
    name: 'Formal Letterhead',
    description: 'Mimics a traditional letterhead style, includes space for a logo.',
    thumbnailUrl: '/thumbnails/formal-letterhead.png', // Replace with actual path
    color: '#7ed321', // Green
    extraFields: [
      { id: 'vatNumber', label: 'Client VAT Number', type: 'text' },
      { id: 'paymentTerms', label: 'Specific Payment Terms', type: 'textarea' },
    ]
  }
];

const LandingPage = () => {
  const { user, token } = useAuth(); // Assuming token is directly available from useAuth()
  const [stats, setStats] = useState({ paidInvoicesCount: 0, dueInvoicesCount: 0, totalRevenue: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !token) { // Ensure user and token are present
        setLoadingStats(false); // Stop loading if no user/token
        return;
      }
      setLoadingStats(true);
      try {
        const response = await fetch('/api/invoices/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized: Token might be invalid or expired.');
            // Optionally, trigger logout or token refresh logic here
          }
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching invoice stats:", error);
      }
      setLoadingStats(false);
    };

    fetchStats();
  }, [user, token]); // Re-fetch if user or token changes

  return (
    <div className={styles.container}>
      {user && (
        <div className={styles.statsContainer}>
          <div className={`${styles.statCard} ${styles.paidCard}`}>
            <h3 className={styles.statTitle}>Paid Invoices</h3>
            {loadingStats ? <p className={styles.statValue}>Loading...</p> : <p className={styles.statValue}>{stats.paidInvoicesCount}</p>}
          </div>
          <div className={`${styles.statCard} ${styles.dueCard}`}>
            <h3 className={styles.statTitle}>Due Invoices</h3>
            {loadingStats ? <p className={styles.statValue}>Loading...</p> : <p className={styles.statValue}>{stats.dueInvoicesCount}</p>}
          </div>
          <div className={`${styles.statCard} ${styles.revenueCard}`}>
            <h3 className={styles.statTitle}>Total Revenue</h3>
            {loadingStats ? <p className={styles.statValue}>Loading...</p> : <p className={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</p>}
          </div>
        </div>
      )}
      <h1 className={styles.title}>Choose Your Invoice Template</h1>
      <div className={styles.grid}>
        {templates.map((template) => (
          <Link
            key={template.id}
            to={`/create/${template.id}`}
            className={styles.cardLink}
          >
            <div
              className={styles.card}
              style={{ borderTopColor: template.color }}
            >
              <div
                className={styles.thumbnailPlaceholder}
                style={{ backgroundColor: template.color + '30' }}
              >
                <span style={{ color: template.color }}>Preview</span>
              </div>
              <p className={styles.templateName}>{template.name}</p>
              <p className={styles.templateDescription}>{template.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
