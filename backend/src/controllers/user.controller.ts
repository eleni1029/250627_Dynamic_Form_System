// backend/src/controllers/user.controller.ts - 用戶控制器
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { UpdateUserRequest } from '../types/user.types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // 獲取用戶資料（含權限）
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const userWithPermissions = await this.userService.getUserWithPermissions(req.user.id);
      
      if (!userWithPermissions) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      logger.debug('User profile retrieved', {
        userId: req.user.id,
        username: req.user.username
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: userWithPermissions.id,
            username: userWithPermissions.username,
            name: userWithPermissions.name,
            avatar_url: userWithPermissions.avatar_url,
            is_active: userWithPermissions.is_active,
            created_at: userWithPermissions.created_at,
            updated_at: userWithPermissions.updated_at,
            permissions: userWithPermissions.permissions
          }
        }
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting profile',
        code: 'GET_PROFILE_SERVER_ERROR'
      });
    }
  };

  // 更新用戶資料
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const updateData: UpdateUserRequest = req.body;

      // 驗證更新數據
      if (updateData.name && (updateData.name.length < 1 || updateData.name.length > 100)) {
        res.status(400).json({
          success: false,
          error: 'Name must be between 1 and 100 characters',
          code: 'INVALID_NAME_LENGTH'
        });
        return;
      }

      if (updateData.password && updateData.password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long',
          code: 'INVALID_PASSWORD_LENGTH'
        });
        return;
      }

      // 普通用戶不能修改啟用狀態
      if (updateData.hasOwnProperty('is_active')) {
        delete updateData.is_active;
      }

      const updatedUser = await this.userService.updateUser(req.user.id, updateData);

      // 更新 session 中的用戶信息
      if (req.session.user) {
        req.session.user.name = updatedUser.name;
        req.session.save((err) => {
          if (err) {
            logger.error('Session save error during profile update:', err);
          }
        });
      }

      logger.info('User profile updated', {
        userId: req.user.id,
        username: req.user.username,
        updatedFields: Object.keys(updateData)
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            avatar_url: updatedUser.avatar_url,
            is_active: updatedUser.is_active,
            updated_at: updatedUser.updated_at
          }
        },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while updating profile',
        code: 'UPDATE_PROFILE_SERVER_ERROR'
      });
    }
  };

  // 獲取用戶的專案權限
  public getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const projects = await this.userService.getUserProjects(req.user.id);

      logger.debug('User projects retrieved', {
        userId: req.user.id,
        projectCount: projects.length
      });

      res.status(200).json({
        success: true,
        data: {
          projects
        }
      });
    } catch (error) {
      logger.error('Get projects controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting projects',
        code: 'GET_PROJECTS_SERVER_ERROR'
      });
    }
  };

  // 檢查專案權限
  public checkProjectPermission = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const { projectKey } = req.params;

      if (!projectKey) {
        res.status(400).json({
          success: false,
          error: 'Project key is required',
          code: 'MISSING_PROJECT_KEY'
        });
        return;
      }

      const hasPermission = await this.userService.hasProjectPermission(req.user.id, projectKey);

      logger.debug('Project permission checked', {
        userId: req.user.id,
        projectKey,
        hasPermission
      });

      res.status(200).json({
        success: true,
        data: {
          projectKey,
          hasPermission
        }
      });
    } catch (error) {
      logger.error('Check project permission controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while checking permission',
        code: 'CHECK_PERMISSION_SERVER_ERROR'
      });
    }
  };

  // 上傳用戶頭像
  public uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // 檢查是否有上傳的文件
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          code: 'NO_FILE_UPLOADED'
        });
        return;
      }

      // 檢查文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
          code: 'INVALID_FILE_TYPE'
        });
        return;
      }

      // 檢查文件大小（5MB 限制）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 5MB',
          code: 'FILE_TOO_LARGE'
        });
        return;
      }

      // 構建頭像 URL
      const avatarUrl = `/uploads/${req.file.filename}`;
      
      // 更新用戶頭像
      const updatedUser = await this.userService.updateAvatar(req.user.id, avatarUrl);

      // 更新 session 中的用戶信息
      if (req.session.user) {
        req.session.user.avatar_url = avatarUrl;
        req.session.save((err) => {
          if (err) {
            logger.error('Session save error during avatar upload:', err);
          }
        });
      }

      logger.info('User avatar uploaded', {
        userId: req.user.id,
        username: req.user.username,
        fileName: req.file.filename,
        fileSize: req.file.size
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            avatar_url: updatedUser.avatar_url,
            updated_at: updatedUser.updated_at
          }
        },
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      logger.error('Upload avatar controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while uploading avatar',
        code: 'UPLOAD_AVATAR_SERVER_ERROR'
      });
    }
  };

  // 獲取用戶統計信息
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // 這裡可以添加用戶統計信息的邏輯
      // 例如：登錄次數、最後登錄時間、使用的專案數量等
      
      const stats = {
        userId: req.user.id,
        joinDate: req.user.created_at || new Date(),
        lastLoginTime: new Date(), // 可以從 activity_logs 表獲取
        projectCount: 0, // 可以從權限表計算
        totalCalculations: 0 // 可以從各專案記錄表計算
      };

      logger.debug('User stats retrieved', {
        userId: req.user.id
      });

      res.status(200).json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      logger.error('Get stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting stats',
        code: 'GET_STATS_SERVER_ERROR'
      });
    }
  };
}