import 'express-session';
import { SessionUser } from './auth.types';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    isAdmin?: boolean;
    adminLastActivity?: number;
    adminUser?: {
      username: string;
      loginTime?: Date;
    };
  }
}
