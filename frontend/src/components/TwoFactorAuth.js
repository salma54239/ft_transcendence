import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { IoAlertCircle } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";
import Modal from './Modal';
import './TwoFactorAuth.css';


const TwoFactorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error2FA, setError2FA] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const response = await axios.get('2fa/status/', {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIs2FAEnabled(response.data.is_enabled);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const handleError = (message) => {
    setError2FA(message);
    setTimeout(() => setError2FA(''), 5000);
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const enable2FA = async () => {
    try {
      setLoading(true);
      setError2FA('');
      const response = await axios.post('2fa/enable/', {}, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.qr_code) {
        setQrCode(response.data.qr_code);
        setShowQR(true);
      }
    } catch (error) {
      handleError('Failed to enable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (verificationCode.length !== 6) {
      handleError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('2fa/verify/', 
        { code: verificationCode },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.data.success) {
        handleSuccess('2FA enabled successfully!');
        setIs2FAEnabled(true);
        setShowQR(false);
        setVerificationCode('');
      }
    } catch (error) {
      handleError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    try {
      setLoading(true);
      const response = await axios.post('2fa/disable/', {}, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        setIs2FAEnabled(false);
        handleSuccess('2FA disabled successfully!');
      }
    } catch (error) {
      handleError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-section">
      <div className="security-header">
        <IoShieldCheckmarkOutline className="security-icon" />
        <h3>Two-Factor Authentication</h3>
      </div>

      <div className="two-fa-status">
        <p>Status: <span className={is2FAEnabled ? 'enabled-text' : 'disabled-text'}>
          {is2FAEnabled ? 'Enabled' : 'Disabled'}
        </span></p>
      </div>

      {success && (
        <div className="status-message success">
          <IoCheckmarkCircle className="status-icon" />
          {success}
        </div>
      )}
      
      <button 
        className={`two-fa-toggle ${is2FAEnabled ? 'enabled' : ''} ${loading ? 'loading' : ''}`}
        onClick={is2FAEnabled ? disable2FA : enable2FA}
        disabled={loading}
      >
        <IoShieldCheckmarkOutline />
        {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
      </button>

      <Modal isOpen={showQR} onClose={() => !loading && setShowQR(false)}>
        <div className="qr-section">
          <h4>Scan QR code with authenticator app</h4>
          {qrCode && (
            <div className="qr-container">
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="2FA QR Code" 
                className="qr-code"
              />
            </div>
          )}
          <div className="verification-section">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              maxLength="6"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className={`verification-input ${error2FA ? 'error' : ''}`}
              autoFocus
              disabled={loading}
            />
            {error2FA && (
              <div className="status-message error">
                <IoAlertCircle className="status-icon" />
                {error2FA}
              </div>
            )}
            <div className="button-group">
              <button 
                className={`verify-button ${loading ? 'loading' : ''}`}
                onClick={verify2FA}
                disabled={loading || verificationCode.length !== 6}
              >
                Verify
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowQR(false);
                  setVerificationCode('');
                  setError2FA('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TwoFactorAuth;