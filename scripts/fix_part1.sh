#!/bin/bash
echo "🔧 Part 1: 路由與模型修復"

# 確保目錄存在
mkdir -p ../backend/src/projects/bmi/{routes,controllers,models,services,middleware,types}
mkdir -p ../backend/src/projects/tdee/{routes,controllers,models,services,middleware,types}

# BMI 路由
cat > ../backend/src/projects/bmi/routes/bmi.routes.ts << 'EOF'
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
EOF

# TDEE 路由
cat > ../backend/src/projects/tdee/routes/tdee.routes.ts << 'EOF'
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
EOF

echo "✅ Part 1 完成: 路由模組已修復"
