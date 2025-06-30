import type { ApiResponse } from '../types/common';

class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    // 修復 Vite 環境變數訪問
    this.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';
    this.timeout = 10000; // 10 秒超時
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 重要：包含 cookies 用於 session
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load TDEE history';
      console.error('TDEE history loading error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 清除結果
  const clearResult = () => {
    lastResult.value = null;
    error.value = null;
  };

  // 清除歷史
  const clearHistory = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await tdeeApi.clearHistory();
      
      if (response.success) {
        history.value = [];
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear TDEE history';
      console.error('TDEE history clearing error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 刪除特定記錄
  const deleteRecord = async (recordId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await tdeeApi.deleteRecord(recordId);
      
      if (response.success) {
        history.value = history.value.filter(record => record.id !== recordId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete TDEE record';
      console.error('TDEE record deletion error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // 狀態
    isLoading,
    lastResult,
    lastInput,
    history,
    activityLevels,
    error,
    
    // 計算屬性
    hasResult,
    hasHistory,
    
    // 方法
    initializeData,
    calculateTDEE,
    loadHistory,
    clearResult,
    clearHistory,
    deleteRecord
  };
});
