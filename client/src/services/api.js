import axios from "axios";

// The backend uses an HttpOnly cookie, so Axios must send credentials.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
