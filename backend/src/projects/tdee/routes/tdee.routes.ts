import { Router } from 'express';
import { TDEEController } from '../controllers/TDEEController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateTDEECalculation } from '../middleware/tdee.validation';
import { validateIdParam } from '../../../middleware/validation.middleware';

export const createTDEERoutes = (): Router => {
  const router = Router();
  const tdeeController = new TDEEController();

  router.use(authMiddleware);
  router.post('/calculate', validateTDEECalculation, tdeeController.calculate);
  router.get('/history', tdeeController.getHistory);
  router.get('/latest', tdeeController.getLatest);
  router.get('/activity-levels', tdeeController.getActivityLevels);
  router.get('/stats', tdeeController.getUserStats);
  router.delete('/records/:id', validateIdParam('id'), tdeeController.deleteRecord);
  router.delete('/history', tdeeController.clearHistory);
  router.post('/validate', validateTDEECalculation, tdeeController.validateData);

  return router;
};
