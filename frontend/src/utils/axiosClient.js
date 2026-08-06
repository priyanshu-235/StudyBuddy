import axios from "axios"

const axiosClient =  axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor to sanitize errors and prevent backend details leakage
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sanitize error messages to prevent exposing backend details
    if (error.response?.data) {
      const data = error.response.data;
      
      // Remove any stack traces, internal paths, or sensitive information
      if (typeof data === 'string') {
        error.response.data = data
          .replace(/at\s+.*:\d+:\d+/g, '') // Remove stack traces
          .replace(/\/[a-zA-Z0-9_\-\/]+\/[a-zA-Z0-9_\-\/]+/g, '[path]') // Remove file paths
          .replace(/MongoServerError:\s*/g, '') // Remove MongoDB error prefixes
          .replace(/E11000\s+duplicate\s+key\s+error/g, 'Duplicate entry') // Simplify duplicate key errors
          .trim();
      }
      
      // If data is an object, sanitize specific fields
      if (typeof data === 'object') {
        if (data.stack) delete data.stack;
        if (data.code && typeof data.code === 'number') delete data.code;
        if (data.keyPattern) delete data.keyPattern;
        if (data.keyValue) delete data.keyValue;
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;

