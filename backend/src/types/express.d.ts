import { SessionUser } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      isAdmin?: boolean;
      file?: Express.Multer.File;
    }
  }
}
