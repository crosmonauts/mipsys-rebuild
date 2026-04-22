import axios from "axios";

export const apiClient = axios.create({
  // Sesuaikan port-nya dengan port NestJS kamu (misal 3001)
  baseURL: "http://localhost:3001", 
  headers: {
    "Content-Type": "application/json",
  },
});