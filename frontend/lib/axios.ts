import axios from "axios";

const api = axios.create({
  baseURL: "https://repolens-murfai.onrender.com/api/v1",
  withCredentials: true,
});

export default api;