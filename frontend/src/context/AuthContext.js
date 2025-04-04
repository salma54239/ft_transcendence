import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const httplink = (path="") => {
  return `https://${window.location.host}/api/${path}`
}

export const wslink = (path="") => {
  return `wss://${window.location.host}/ws/${path}`
}


axios.defaults.withCredentials = true;
axios.defaults.baseURL = httplink();

export const AuthProvider = ({ children }) => {
  const [islog, setIslog] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          setIslog(false);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authResponse = await axios.get('islogged/');
      if (authResponse.data.message === "User is authenticated") {
        setIslog(true);
        try {
          const userResponse = await axios.get('infoUser/');
          setUser(userResponse.data);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          setUser(null);
        }
      }
    } catch (error) {
      setIslog(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const loginResponse = await axios.post('login/', { email, password });
      
      if (loginResponse.data.requires2FA) {
        return loginResponse.data;
      }
      
      setIslog(true);
      const userResponse = await axios.get('infoUser/');
      setUser(userResponse.data);
      return loginResponse.data;
    } catch (error) {
      console.error('Login error:', error);
      setIslog(false);
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ 
      user,
      setUser,
      islog, 
      setIslog,
      login,
      logout: async () => {
        try {
          await axios.post('logout/');
        } finally {
          setIslog(false);
          setUser(null);
        }
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};