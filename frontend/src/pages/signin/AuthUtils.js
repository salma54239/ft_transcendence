import axios from 'axios'

export const handleLogin42 = () => {
  return axios({
    method: 'GET',
    url: 'auth/42/login/',
    withCredentials: true,
  })
  .then((response) => {
    const { auth_url } = response.data;
    if (auth_url) {
        window.location.href = auth_url;
    } else {
        throw new Error('Authorization URL not provided by the backend');
    }
  });
};

export const verify2FACode = async (userId, code) => {
  try {
    const response = await axios.post('verify-login-2fa/', 
      {
        user_id: userId,
        code: code
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Verification failed');
  }
};