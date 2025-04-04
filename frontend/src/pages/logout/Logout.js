import { useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const Logout = () => {
  const { addNotification } = useNotification();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    if (!isLoggingOut.current) {
      isLoggingOut.current = true;
      logout();
      addNotification("Successfully logged out", "success");
      navigate('/signIn');
    }
  }, [logout, navigate, addNotification]);

  return null;
};

export default Logout;