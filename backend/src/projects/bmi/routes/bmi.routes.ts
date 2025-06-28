import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBodyMetrics } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  
  router.use(authMiddleware);
  
  router.post('/calculate', validateBodyMetrics, (req, res) => {
    res.json({ success: true, message: 'BMI endpoint working' });
  });
  
  return router;
};
