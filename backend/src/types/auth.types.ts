import { Request } from 'express';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser extends User {}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      isAdmin?: boolean;
    }
  }
}
