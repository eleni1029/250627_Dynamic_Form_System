import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  
  return res.status(401).json({
    success: false,
    error: 'Authentication required'
  });
};
