import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthForm.module.css'; // We'll create this CSS module next

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, error, clearErrors, loading } = useAuth();

  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
  });

  const { organizationName, email, password, confirmPassword, companyAddress, companyEmail, companyPhone } = formData;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/invoices'); // Redirect to invoices list if already authenticated
    }
    if (error) {
      // alert(error); // Simple error display for now
      console.log(error);
      clearErrors();
    }
  }, [isAuthenticated, error, navigate, clearErrors]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
    } else {
      // companyEmail and companyPhone are optional, pass them if filled
      const registrationData = {
        organizationName,
        email,
        password,
        companyAddress,
        companyEmail: companyEmail || undefined,
        companyPhone: companyPhone || undefined,
      };
      await register(registrationData);
    }
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={onSubmit} className={styles.authForm}>
        <h2>Register Organization</h2>
        <div className={styles.formGroup}>
          <label htmlFor='organizationName'>Organization Name*</label>
          <input
            type='text'
            name='organizationName'
            value={organizationName}
            onChange={onChange}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor='email'>Login Email*</label>
          <input type='email' name='email' value={email} onChange={onChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor='password'>Password* (min. 6 characters)</label>
          <input type='password' name='password' value={password} onChange={onChange} required minLength='6' />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor='confirmPassword'>Confirm Password*</label>
          <input type='password' name='confirmPassword' value={confirmPassword} onChange={onChange} required minLength='6' />
        </div>
        <h3 className={styles.optionalHeader}>Optional Company Details (for Invoices)</h3>
        <div className={styles.formGroup}>
          <label htmlFor='companyAddress'>Company Address</label>
          <input type='text' name='companyAddress' value={companyAddress} onChange={onChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor='companyEmail'>Company Email (e.g., for customer contact)</label>
          <input type='email' name='companyEmail' value={companyEmail} onChange={onChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor='companyPhone'>Company Phone</label>
          <input type='text' name='companyPhone' value={companyPhone} onChange={onChange} />
        </div>
        <button type='submit' className={styles.submitButton} disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className={styles.authLink}>
          Already have an account? <Link to='/login'>Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
