// backend/src/types/auth.types.ts
export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: Omit<User, 'password_hash'>;
  message?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
}

// Express Session 擴展
declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    isAdmin?: boolean;
  }
}

// ===== 用戶管理類型 =====
// backend/src/types/user.types.ts
export interface CreateUserRequest {
  username: string;
  password: string;
  name: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
  is_active?: boolean;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserPermission {
  id: string;
  user_id: string;
  project_id: string;
  granted_at: Date;
  granted_by: string;
}

export interface UserWithPermissions extends User {
  permissions: {
    project_key: string;
    project_name: string;
    granted_at: Date;
  }[];
}

// ===== 專案相關類型 =====
// backend/src/types/project.types.ts
export interface Project {
  id: string;
  project_key: string;
  project_name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;  // cm
  weight: number;  // kg
  age?: number;
  gender?: 'male' | 'female' | 'other';
  created_at: Date;
}

export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface BMICalculationResponse {
  bmi: number;
  category: string;
  description: string;
  record_id: string;
}

export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;  // cm
  weight: number;  // kg
  age: number;
  gender: 'male' | 'female';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at: Date;
}

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface TDEECalculationResponse {
  bmr: number;      // 基礎代謝率
  tdee: number;     // 每日總能量消耗
  activity_factor: number;
  description: string;
  record_id: string;
}

// ===== 活動記錄類型 =====
export interface ActivityLog {
  id: string;
  user_id?: string;
  action_type: string;
  action_description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface CreateActivityLogRequest {
  user_id?: string;
  action_type: string;
  action_description?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ActivityLogListResponse {
  logs: (ActivityLog & { username?: string })[];
  total: number;
  page: number;
  limit: number;
}

// ===== API 響應類型 =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ===== 權限管理類型 =====
export interface ProjectPermission {
  user_id: string;
  project_id: string;
  username: string;
  user_name: string;
  project_key: string;
  project_name: string;
  granted_at: Date;
  granted_by: string;
}

export interface GrantPermissionRequest {
  user_id: string;
  project_id: string;
}

export interface RevokePermissionRequest {
  user_id: string;
  project_id: string;
}

// ===== Express Request 擴展 =====
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      isAdmin?: boolean;
    }
  }
}

// ===== 文件上傳類型 =====
export interface FileUploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  message?: string;
}