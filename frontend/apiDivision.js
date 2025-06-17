import axios from 'axios';

const apiDivision = axios.create({
  baseURL: 'https://apisegen.apn.gob.ve/api/v1/', // API Division Politico Territorial
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in the headers
apiDivision.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // Get stored token from localStorage
  
  if (token) {
    // Verifica si ya hay params definidos
    config.params = {
      ...config.params,
      token: token, // Agrega el token como query param
    };
  }
  return config;
});

export default apiDivision;
