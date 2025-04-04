import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';


const LoginCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIslog } = useAuth();
  const { addNotification } = useNotification();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (!processed) {
      const searchParams = new URLSearchParams(location.search);
      const status = searchParams.get('status');

      const timer = setTimeout(() => {
        if (status === 'success') {
          setIslog(true);
          addNotification("Successfully logged in with 42!", "success");
          setTimeout(() => navigate('/home'), 100); 
        } else if (status === 'failed'  ) {
          addNotification("Login failed", "error");
          console.error('Login failed');
          setTimeout(() => navigate('/signIn'), 100);
        } else {
          addNotification("Unexpected login response", "error");
          console.warn('Unexpected status:', status);
          setTimeout(() => navigate('/signIn'), 100);
        }
        setProcessed(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location, navigate, setIslog, addNotification, processed]);

  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-lg">Processing login...</div>
    </div>
  );
};

export default LoginCallback;