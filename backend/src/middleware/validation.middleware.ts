import { Request, Response, NextFunction } from 'express';

export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const { height, weight } = req.body;
  
  if (!height || !weight) {
    res.status(400).json({
      success: false,
      error: 'Height and weight are required'
    });
    return;
  }
  
  next();
};
