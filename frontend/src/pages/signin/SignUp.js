import React, { useState } from 'react';
import Banner from '../../components/Banner';
import './SignUp.css'
import { Si42 } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { handleLogin42 } from './AuthUtils';
import { useNotification } from '../../context/NotificationContext';



const SignUp = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [password2, setPassword2] = useState('');
    
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();
  
    if (password !== password2) {
      addNotification("Passwords do not match", "error");
      return;
    }
    else if (username.length < 3) {
      addNotification("Username must be at least 3 characters long.", "warning");
      return ;
    }
    else if (username.length > 8) {
      addNotification("Username must be no more than 8 characters long.", "warning");
      return ;
    }
    else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      addNotification("Username must be alphanumeric.", "warning");
      return ;
    }
    else if (password.length < 8) {
      addNotification("Password must be at least 8 characters long", "warning");
      return;
    }
  
    axios({
      method: 'post',
      url: 'register/',
      data: {
        email: email,
        password: password,
        password2: password2,
        display_name: username,
      },
    })
    .then((data) => 
    {
      addNotification("Account created successfully! Please log in.", "success");
      navigate('/signIn');
    })
    .catch((error) => 
    {
      if (error.response) 
      {
        const errorData = error.response.data;
        if (errorData.email) 
        {
          addNotification(errorData.email[0], "error");
        }
        if (errorData.password) 
        {
          addNotification(errorData.password[0], "error");
        }
      } 
      else 
      {
        addNotification("Network error. Please check your connection.", "error");
      }
    });
  };


    const handleClickCreateAccount = () =>{
      navigate('/signIn')
    }
    return (
      <div className='sup-container'>
        <div className='sup-banner'><Banner /></div>
        <div className='sup-container-content'>
            <div className='sup-title-welcome'>Welcome Back</div>
            <form action='submit' onSubmit={handleSignUp}>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {setEmail(e.target.value);}}
                className='sup-input'
              />
            </div>
            <div>
              <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='sup-input'
                  />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='sup-input'
                />
            </div>
            <div>
              <input
                  type="password"
                  placeholder="Confirm Password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className='sup-input'
                  />
            </div>
            <div><button type="submit" className='sup-button-login'>Sign up</button>

            </div>
            <div className="sup-create-account"><div> Already have an account?</div><div onClick={handleClickCreateAccount} className="sup-create-account-button">Sign in</div></div>
            <div className="sup-text-or">Or</div>
            <div className="sup-login-by">
              <div className="sup-login-intra" onClick={handleLogin42}><Si42 /></div>
            </div>
            </form>
        </div>
          
      </div> 
    );
  };
  
  export default SignUp;