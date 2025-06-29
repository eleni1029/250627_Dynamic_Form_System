import { Router } from 'express';
import { PROJECT_CONFIGS } from '../config/projects.config';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    services: {
      auth: 'ready',
      projects: {
        bmi: true,
        tdee: true
      }
    },
    availableProjects: PROJECT_CONFIGS.length
  });
});

export default router;
