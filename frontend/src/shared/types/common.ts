// ===== frontend/src/shared/types/common.ts =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface Project {
  key: string;
  name: string;
  description: string;
  path: string;
}

export interface UserProjectPermission {
  user_id: string;
  project_id: string;
  project: Project;
}