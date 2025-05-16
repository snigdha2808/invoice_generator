import React from 'react';
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate, // Import Navigate
  useLocation // Import useLocation
} from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Import useAuth

import LandingPage from './pages/LandingPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import ViewInvoicesPage from './pages/ViewInvoicesPage';
import ViewInvoicePage from './pages/ViewInvoicePage';
import LoginPage from './pages/LoginPage'; // Import LoginPage
import RegisterPage from './pages/RegisterPage'; // Import RegisterPage
import PayInvoicePage from './components/PayInvoicePage'; // Import PayInvoicePage
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute

import './App.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const { isAuthenticated, user, logout, loading } = useAuth(); // Get auth state and functions

  const handleInvoiceCreated = (newInvoice) => {
    console.log('Invoice created in App.jsx:', newInvoice);
    navigate('/invoices'); // Navigate after invoice creation, assuming it's a private route
  };

  const navLinkStyle = { marginRight: '1rem', textDecoration: 'none', color: '#007bff', fontWeight: 'bold' };
  const navButtonStyle = { ...navLinkStyle, cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: '#dc3545' };

  return (
    <div className="App">
      <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {isAuthenticated && (
            location.pathname === '/' ? (
              <Link to="/invoices" style={navLinkStyle}>My Invoices</Link>
            ) : (
              <Link to="/" style={navLinkStyle}>Choose Your Template</Link>
            )
          )}
        </div>
        <div>
          {isAuthenticated && (
            <>
              <span style={navLinkStyle}>Welcome, {user?.organizationName || user?.email}!</span>
              <button onClick={logout} style={navButtonStyle}>Logout</button>
            </>
          )}
        </div>
      </nav>

      {loading && <p>Loading application...</p> /* Show a global loading indicator if context is loading */}
      {!loading && (
        <Routes>
          {/* Conditional Public Routes */}
          <Route 
            path="/"
            element={isAuthenticated ? <LandingPage /> : <Navigate to="/login" replace />}
          />
          <Route 
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route 
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
          />
          <Route path="/pay-invoice/:invoiceId" element={<PayInvoicePage />} /> {/* Public route for payment */}

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route
              path="/create/:templateId"
              element={<CreateInvoicePage onInvoiceCreated={handleInvoiceCreated} />}
            />
            <Route path="/invoices" element={<ViewInvoicesPage />} />
            <Route path="/invoices/view/:invoiceId" element={<ViewInvoicePage />} />
          </Route>
        </Routes>
      )}
    </div>
  );
}

export default App;

