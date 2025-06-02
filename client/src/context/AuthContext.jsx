import React, { createContext, useReducer, useEffect, useContext } from 'react';
import axios from 'axios';

const API_URL = 'https://snigdhagupta.in/api/auth'; // Your backend auth URL

// Initial state
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null,
};

// Create context
export const AuthContext = createContext(initialState);

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload, // payload is the user object from /me
        error: null,
      };
    case 'REGISTER_SUCCESS':
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false, // We will set loading again before fetching user details if needed
        user: action.payload.user || null, // If backend sends user object with token, use it
        error: null,
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'LOGOUT':
    case 'REGISTER_FAIL':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload, // error message
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Utility to set authorization header
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Helper function to load user details and update state
  const _loadUserAndUpdateState = async (tokenForAuth) => {
    if (!tokenForAuth) {
      dispatch({ type: 'AUTH_ERROR', payload: 'No token provided for loading user' });
      return;
    }
    setAuthToken(tokenForAuth);
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.get(`${API_URL}/me`);
      dispatch({ type: 'USER_LOADED', payload: res.data });
    } catch (err) {
      localStorage.removeItem('token'); // Clear token if /me fails
      setAuthToken(null);
      dispatch({ type: 'AUTH_ERROR', payload: err.response?.data?.msg || 'Session expired or invalid. Please login again.' });
    }
  };

  // Load user on initial render if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      _loadUserAndUpdateState(token);
    } else {
      // No token, ensure loading is false and not authenticated
      dispatch({ type: 'AUTH_ERROR', payload: 'No token found, user not loaded.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Register user
  const register = async (formData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.post(`${API_URL}/register`, formData);
      // Dispatch success to set token, isAuthenticated. User object might be partial or not there.
      dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
      if (res.data.token) {
        await _loadUserAndUpdateState(res.data.token); // Load full user details
      }
    } catch (err) {
      dispatch({
        type: 'REGISTER_FAIL',
        payload: err.response?.data?.msg || 'Registration failed',
      });
    }
  };

  // Login user
  const login = async (formData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.post(`${API_URL}/login`, formData);
      // Dispatch success to set token, isAuthenticated. User object might be partial or not there.
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      if (res.data.token) {
        await _loadUserAndUpdateState(res.data.token); // Load full user details
      }
    } catch (err) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: err.response?.data?.msg || 'Login failed',
      });
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    setAuthToken(null); // Clear auth header
  };

  // Clear errors
  const clearErrors = () => dispatch({ type: 'CLEAR_ERRORS' });

  return (
    <AuthContext.Provider
      value={{
        ...state, // Spread all state values
        register,
        login,
        logout,
        loadUser: _loadUserAndUpdateState, // Expose the new load user function if needed directly
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};
