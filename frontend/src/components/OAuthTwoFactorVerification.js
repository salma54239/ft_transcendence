import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verify2FACode } from '../pages/signin/AuthUtils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './TwoFactorAuth.css';
import axios from 'axios';

const OAuthTwoFactorVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setIslog, setUser } = useAuth();
  const { addNotification } = useNotification();
  const inputRefs = Array(6).fill(0).map(() => React.createRef());

  const userId = new URLSearchParams(location.search).get('user_id');

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    try {
      await verify2FACode(userId, verificationCode);
      addNotification("OAuth 2FA verification successful", "success");
      setIslog(true);
      try {
        const userResponse = await axios.get('infoUser/');
        setUser(userResponse.data);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setUser(null);
      }
      navigate('/home');
    } catch (err) {
      addNotification(err.message || "Invalid verification code", "error");
      setError(err.error || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Two-Factor Authentication</h2>
        <p className="auth-subtitle">Enter the 6-digit code from your authenticator app</p>
        
        <form onSubmit={handleSubmit}>
          <div className="verification-inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="code-input"
              />
            ))}
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button">
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default OAuthTwoFactorVerification;