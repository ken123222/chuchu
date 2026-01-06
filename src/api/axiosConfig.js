// frontend/src/api/axiosConfig.js
import axios from "axios";

/**
 * FIXED BASE URL LOGIC:
 * During Vercel deployment, import.meta.env.VITE_API_URL must be used.
 * We use a ternary or OR operator to ensure it fallback to local only in dev mode.
 */
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://10.244.209.27:5000/api";

const instance = axios.create({
  baseURL,
  // Required for sending cookies/sessions if your backend uses them
  withCredentials: true, 
});

// Interceptor to attach JWT token to every request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Ensure there is a space between Bearer and the token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;