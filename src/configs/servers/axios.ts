import { getCookiesAction } from "@/app/actions";
import axios from "axios";

export const axiosApp = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosApp.interceptors.request.use(async (config) => {
  const token = (await getCookiesAction())?.token || "";

  if (token) {
    config.headers.Authorization = `Bearer ${token.value}`;
  }
  return config;
});
