import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthForm.module.css'; // Reusing the same styles

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error, clearErrors, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/invoices'); // Redirect to invoices list if already authenticated
    }
    if (error) {
      alert(error); // Simple error display
      clearErrors();
    }
  }, [isAuthenticated, error, navigate, clearErrors]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={onSubmit} className={styles.authForm}>
        <h2>Login</h2>
        <div className={styles.formGroup}>
          <label htmlFor='email'>Email</label>
          <input type='email' name='email' value={email} onChange={onChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor='password'>Password</label>
          <input type='password' name='password' value={password} onChange={onChange} required />
        </div>
        <button type='submit' className={styles.submitButton} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className={styles.authLink}>
          Don't have an account? <Link to='/register'>Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
