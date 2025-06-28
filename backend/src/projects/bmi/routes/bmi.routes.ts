import { Router } from 'express';
import { BMIController } from '../controllers/BMIController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBodyMetrics, validateIdParam } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  const bmiController = new BMIController();

  router.use(authMiddleware);
  router.post('/calculate', validateBodyMetrics, bmiController.calculate);
  router.get('/history', bmiController.getHistory);
  router.get('/latest', bmiController.getLatest);
  router.get('/stats', bmiController.getUserStats);
  router.delete('/records/:id', validateIdParam('id'), bmiController.deleteRecord);
  router.delete('/history', bmiController.clearHistory);
  router.post('/validate', validateBodyMetrics, bmiController.validateData);

  return router;
};
