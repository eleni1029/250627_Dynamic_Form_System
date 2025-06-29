export interface UpdateUserRequest {
  name?: string;
  password?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface CreateUserRequest {
  username: string;
  name: string;
  password: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UserWithPermissions {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
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
