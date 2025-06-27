import { Router } from 'express';

const router = Router();

// 測試路由
router.get('/test', (req, res) => {
  res.json({ message: 'User routes working' });
});

export default router;
