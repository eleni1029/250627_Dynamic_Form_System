import { Router } from 'express';
import { UserService } from '../services/user.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

function getUserService(): UserService {
  return new UserService();
}

router.get('/permissions/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
      return;
    }

    const userWithProjects = await getUserService().getUserWithProjects(userId);
    
    if (!userWithProjects) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    const projects = userWithProjects.projects;

    res.json({
      success: true,
      data: {
        userId,
        projects
      },
      message: 'User permissions retrieved successfully'
    });

  } catch (error) {
    logger.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user permissions',
      code: 'GET_PERMISSIONS_ERROR'
    });
  }
});

export default router;
