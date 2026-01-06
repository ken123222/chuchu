// frontend/src/api/axiosConfig.js
import axios from "axios";

/**
 * VITE_API_URL should be set in Vercel Environment Variables as:
 * https://your-backend-api.vercel.app/api
 */
const baseURL = import.meta.env.VITE_API_URL || "http://10.244.209.27:5000/api";

const instance = axios.create({
  baseURL,
  withCredentials: true, 
});

// Interceptor to attach JWT token to every request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;