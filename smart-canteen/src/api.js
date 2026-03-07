import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9090",
  timeout: 5000, // 5 seconds timeout to prevent indefinite loading
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
