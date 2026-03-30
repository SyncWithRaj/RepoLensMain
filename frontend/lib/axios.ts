import axios from "axios";

const api = axios.create({
  baseURL: "https://repolens-murfai.onrender.com/api/v1",
  withCredentials: true,
});

// ✅ Attach JWT token from cookie as Authorization header
// This bypasses cross-origin cookie issues with modern browsers
api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
    if (match) {
      config.headers.Authorization = `Bearer ${match[1]}`;
    }
  }
  return config;
});

export default api;