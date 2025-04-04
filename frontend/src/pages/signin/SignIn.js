import React, { useState } from 'react';
import Banner from '../../components/Banner';
import './SignIn.css';
import { Si42 } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import { handleLogin42 } from './AuthUtils';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';


const SignIn = () => {
  const { login } = useAuth();
  const { addNotification } = useNotification(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => 
  {
    e.preventDefault();
    if (!email || !password)
      {
        addNotification("Please fill in all fields", "warning");
        return;
      } 
  
    try 
    {
      const response = await login(email, password);
      setError('');
      if (response.requires2FA) 
      {
        addNotification("Please enter your 2FA code", "info");
        navigate(`/verify-2fa?user_id=${response.user_id}`);
      } 
      else 
      {
        addNotification("Successfully logged in!", "success");
        navigate('/home');
      }
    } 
    catch (err) 
    {
      addNotification("Login failed. Please check your credentials.", "error");
    }
  };

  const handleClickCreateAccount = () => 
  {
    navigate('/signUp');
  };

  const handleOAuthLogin = async (e) => {
    e.preventDefault();
    
    if (!isLoading) {
      setIsLoading(true);
      addNotification("Redirecting to 42 login...", "info");
      
      try {
        await handleLogin42();
      } catch (error) {
        addNotification("Failed to connect to 42 login", "error");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className='sin-container'>
      <div className='sin-banner'><Banner /></div>
      <div className='sin-container-content'>
        <div className='sin-title-welcome'>Welcome Back</div>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='sin-input'
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='sin-input'
            />
          </div>
          {error && <p className='sin-error'>{error}</p>}
          <div><button type="submit" className='sin-button-login'>Login</button></div>
          <div className="sin-create-account">
            <div>Don't have an account?</div>
            <div onClick={handleClickCreateAccount} className="sin-create-account-button">Sign up</div>
          </div>
          <div className="sin-text-or">Or</div>
          <div className={`sin-login-by ${isLoading ? 'loading' : ''}`}>
            <div className="sin-login-intra" onClick={handleOAuthLogin }>
              <Si42 /></div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

