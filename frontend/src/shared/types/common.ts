// ===== frontend/src/shared/types/common.ts =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  key: string;
  name: string;
  description: string;
  path: string;
  version?: string;
  features?: string[];
  endpoints?: Record<string, string>;
}

export interface UserProjectPermission {
  user_id: string;
  project_id: string;
  project: Project;
  granted_at?: string;
}

// 分頁相關類型
export interface PaginationParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 錯誤處理類型
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: ValidationError[] | any;
  timestamp?: string;
}

// 統計相關類型
export interface Trend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  change: number;
  timeframe: string;
}

export interface BaseStatistics {
  totalRecords: number;
  lastCalculated: string | null;
  trend: Trend;
}

// 表單狀態類型
export interface FormState {
  isLoading: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// 通用的選項類型
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

// 本地化類型
export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

// 主題配置類型
export interface ThemeConfig {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// 通用工具類型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}
