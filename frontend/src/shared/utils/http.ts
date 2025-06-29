import axios, { type AxiosInstance } from 'axios';
import type { ApiResponse } from '../types/common';

export class HttpClient {
 private instance: AxiosInstance;

 constructor() {
   this.instance = axios.create({
     baseURL: (import.meta as any).env.VITE_API_BASE_URL || '/api',
     timeout: 10000,
     withCredentials: true,
     headers: {
       'Content-Type': 'application/json',
     },
   });
 }

 async get<T>(url: string): Promise<ApiResponse<T>> {
   try {
     const response = await this.instance.get(url);
     return response.data;
   } catch (error: any) {
     return {
       success: false,
       error: error.response?.data?.message || error.message || '請求失敗'
     };
   }
 }

 async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
   try {
     const response = await this.instance.post(url, data);
     return response.data;
   } catch (error: any) {
     return {
       success: false,
       error: error.response?.data?.message || error.message || '請求失敗'
     };
   }
 }
}

export const httpClient = new HttpClient();
