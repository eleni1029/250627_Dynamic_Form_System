import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth.types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const userWithPermissions = await this.userService.getUserWithProjects(req.user.id);
      
      if (!userWithPermissions) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: userWithPermissions,
          permissions: userWithPermissions.projects
        },
        message: 'User profile retrieved successfully'
      });

    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile',
        code: 'GET_USER_ERROR'
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const { name, avatar_url } = req.body;
      
      const updatedUser = await this.userService.updateUser(req.user.id, {
        name,
        avatar_url
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // 更新 session 中的用戶信息
      if (req.session && req.session.user) {
        req.session.user.name = updatedUser.name;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            avatar_url: updatedUser.avatar_url,
            is_active: updatedUser.is_active,
            created_at: updatedUser.created_at
          }
        },
        message: 'Profile updated successfully'
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  }

  async getUserProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const userWithProjects = await this.userService.getUserWithProjects(req.user.id);
      
      if (!userWithProjects) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          projects: userWithProjects.projects
        },
        message: 'User projects retrieved successfully'
      });

    } catch (error) {
      logger.error('Get user projects error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user projects',
        code: 'GET_PROJECTS_ERROR'
      });
    }
  }

  async checkProjectAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const { projectKey } = req.params;
      
      const userWithProjects = await this.userService.getUserWithProjects(req.user.id);
      
      if (!userWithProjects) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      const hasPermission = userWithProjects.projects.some(
        project => project.key === projectKey
      );

      res.json({
        success: true,
        data: {
          hasAccess: hasPermission,
          projectKey: projectKey
        },
        message: hasPermission ? 'Access granted' : 'Access denied'
      });

    } catch (error) {
      logger.error('Check project access error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check project access',
        code: 'CHECK_ACCESS_ERROR'
      });
    }
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // 這裡應該處理文件上傳邏輯
      // 暫時返回模擬的頭像 URL
      const avatarUrl = `/uploads/avatars/${req.user.id}_${Date.now()}.jpg`;
      
      const updatedUser = await this.userService.updateUser(req.user.id, {
        avatar_url: avatarUrl
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          avatar_url: updatedUser.avatar_url
        },
        message: 'Avatar uploaded successfully'
      });

    } catch (error) {
      logger.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar',
        code: 'UPLOAD_AVATAR_ERROR'
      });
    }
  }
}
