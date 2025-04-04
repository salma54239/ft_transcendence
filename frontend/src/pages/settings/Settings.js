import React, { useState } from 'react';
import Banner from '../../components/Banner';
import TwoFactorAuth from '../../components/TwoFactorAuth';
import './Settings.css';
import { MdPhotoCamera } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { FaUserEdit } from "react-icons/fa";
import { RiLockPasswordLine } from "react-icons/ri";
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import DefaultAvatar from './profile.jpg'

const Settings = () => {
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confimPassword, setConfimPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errorp, setErrorp] = useState('');
  const [successp, setSuccessp] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const { setUser ,user} = useAuth();
  axios.defaults.withCredentials = true;

  

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('file-input')
      setAvatar(file);
      setRemoveAvatar(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('file-input').click();
  };

  const removeImage = () => {
    setRemoveAvatar(true)
    setAvatar(null)
  };


  const saveProfileChanges = async () => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('username', username);
    formData.append('avatar', avatar);
    formData.append('removeAvatar', removeAvatar ? 'yes' : 'no');
    setError('');
    setSuccess('');
    setErrorp('');
    setSuccessp('');
  
    try{
      await axios.put(`profile/update/`, formData );
      setSuccess('Profile details updated successfully.');
      setUsername('');
      setEmail('');
      setAvatar(null);
  
      const userResponse = await axios.get('infoUser/');
      setUser(userResponse.data);
    }
    catch (err){
      if (err.response){
        const errorMsg = err.response.data.error;
        setError(errorMsg);
      }
      else{
        setError('An error occurred: ' + err.message);
      }
    }
  };

  const savePasswordChanges = () => {
    setError('');
    setSuccess('');
    setErrorp('');
    setSuccessp('');
  
    axios.get(`checkloginmethod/`)
      .then((response) => {
        const { status } = response.data;
  
        if (status === 'ok') {
          setErrorp('You cannot change when logged by Intra.');
        } else {
          axios.put(`profile/password/`, {
            currentPassword,
            newPassword,
            confimPassword
          })
            .then(() => {
              setSuccessp('Password changed successfully.');
              setCurrentPassword('');
              setNewPassword('');
              setConfimPassword('');
            })
            .catch((err) => {
              if (err.response) {
                const status = err.response.status;
                const errorMsg = err.response.data.error;
  
                if (status === 400) {
                  setErrorp(errorMsg);
                } else {
                  setErrorp('Server error. Please try again later.');
                }
              } else if (err.request) {
                setErrorp('No response from the server. Please check your connection.');
              } else {
                setErrorp(`An error occurred: ${err.message}`);
              }
            });
        }
      })
      .catch((err) => {
        setErrorp('Could not verify login method. Please try again later.');
        console.error(err);
      });
  };
  return (
    <div className="content-settings">
      <Banner />
      <div className="account-settings">
        <div className="settings-header">
          <h1 className="settings-title">Account Settings</h1>
        </div>
        <div className="settings-container">

          <div className="settings-grid">
            <div className="settings-section">
              <div className="section-header">
                <div className='section-title-profile'>
                  <FaUserEdit className="section-icon" />
                  <p className='titles-update'>Update Profile</p>
                </div>
                <div className="profile-image-section">
                  <div className="profile-image-wrapper">
                    <img src={avatar ? URL.createObjectURL(avatar) : removeAvatar ? DefaultAvatar : user.avatar} alt="Profile" className="profile-image" />
                    <div className="image-overlay">
                      <input 
                        type="file" 
                        id="file-input" 
                        onChange={handleImageChange} 
                        className="file-input" 
                        style={{ display: 'none' }} 
                      />
                      <button className="change-photo-btn" onClick={triggerFileInput}>
                        <MdPhotoCamera className="camera-icon" />
                      </button>
                    </div>
                  </div>
                  <button className="remove-photo-btn" onClick={removeImage}>
                    <IoClose className="remove-icon" />
                    Remove
                  </button>
                </div>
              </div>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="settings-input"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="settings-input"
                  />
                  <div className='setting-message'>
                  {error && <p style={{ color: '#E84172' }}>{error}</p>}
                  {success && <p style={{ color: '#BBFC52' }}>{success}</p>}
                  </div>
                <div className="settings-actions">
                  <button className="save-settings-btn" onClick={saveProfileChanges}>
                    Save Changes
                  </button>
                </div>
              </div>

            </div>

            <div className="settings-section">
              <div className="section-header">
              <div className='section-title-profile'>
                <RiLockPasswordLine className="section-icon" />
                <p className='titles-update'> Change Password</p>
              </div>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="settings-input"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-input"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confimPassword}
                  onChange={(e) => setConfimPassword(e.target.value)}
                  className="settings-input"
                />
                <div className='setting-message'>
                {errorp && <p style={{ color: '#E84172' }}>{errorp}</p>}
                {successp && <p style={{ color: '#BBFC52' }}>{successp}</p>}
                </div>
                <div className="settings-actions">
                  <button className="save-settings-btn" onClick={savePasswordChanges}>
                    Save Changes
                  </button>
                </div>
              </div>
              <TwoFactorAuth />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;