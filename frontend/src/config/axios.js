import axios from "axios";

// Get the base URL from environment variables or use a default
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? window.location.origin : "http://localhost:5000");

// Configure axios defaults
axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true; // Required for cookies/session

// Add request interceptor to add auth token
axios.interceptors.request.use(
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

export default axios;
