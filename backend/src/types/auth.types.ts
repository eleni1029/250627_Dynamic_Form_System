import { Request } from 'express';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  last_login_at?: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: SessionUser;
  token?: string;
  expiresAt?: Date;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user?: SessionUser;
  session?: {
    id: string;
    expiresAt: Date;
    lastActivity: Date;
  };
}

export interface CreateUserRequest {
  username: string;
  name: string;
  password: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UserWithPermissions extends SessionUser {
  updated_at: Date;
  permissions: string[];
  projects: Array<{
    id: string;
    key: string;
    name: string;
    hasPermission: boolean;
  }>;
}

export interface GrantPermissionRequest {
  userId: string;
  projectKey: string;
}

export interface RevokePermissionRequest {
  userId: string;
  projectKey: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
  url?: string;
}
