import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 暫時跳過管理員檢查
  next();
};
