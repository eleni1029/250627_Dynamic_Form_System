import { query } from '../database/connection';
import { logger } from '../utils/logger';
import { UpdateUserRequest, UserWithPermissions } from '../types/user.types';

export class UserService {
  async getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
    try {
      const result = await query(
        'SELECT id, username, name, avatar_url, is_active, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      const projects = await this.getUserProjects(userId);
      
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        permissions: [],
        projects: projects
      };
    } catch (error) {
      logger.error('Get user with permissions error:', error);
      return null;
    }
  }

  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<any> {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updateData.name) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updateData.name);
      }
      
      if (updateData.avatar_url) {
        fields.push(`avatar_url = $${paramIndex++}`);
        values.push(updateData.avatar_url);
      }
      
      if (fields.length === 0) {
        return null;
      }
      
      values.push(userId);
      
      const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<any> {
    try {
      const result = await query(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [avatarUrl, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Update avatar error:', error);
      throw error;
    }
  }

  async getUserProjects(userId: string): Promise<any[]> {
    try {
      logger.info('Getting projects for user:', userId);
      
      const result = await query(`
        SELECT 
          upp.id as permission_id,
          upp.user_id,
          upp.project_id,
          upp.granted_at,
          upp.granted_by,
          p.id as project_id,
          p.project_key,
          p.project_name,
          p.description,
          p.is_active,
          p.created_at as project_created_at
        FROM user_project_permissions upp
        JOIN projects p ON upp.project_id = p.id
        WHERE upp.user_id = $1 AND p.is_active = true
        ORDER BY p.project_name
      `, [userId]);
      
      logger.info('Found projects for user:', {
        userId,
        projectCount: result.rows.length,
        projects: result.rows.map(row => ({ key: row.project_key, name: row.project_name }))
      });
      
      return result.rows.map(row => ({
        id: row.permission_id,
        user_id: row.user_id,
        project_id: row.project_id,
        granted_at: row.granted_at,
        granted_by: row.granted_by,
        project: {
          id: row.project_id,
          key: row.project_key,
          name: row.project_name,
          description: row.description,
          path: `/projects/${row.project_key}`
        }
      }));
    } catch (error) {
      logger.error('Get user projects error:', error);
      return [];
    }
  }

  async hasProjectPermission(userId: string, projectKey: string): Promise<boolean> {
    try {
      const result = await query(`
        SELECT 1 
        FROM user_project_permissions upp
        JOIN projects p ON upp.project_id = p.id
        WHERE upp.user_id = $1 AND p.project_key = $2 AND p.is_active = true
      `, [userId, projectKey]);
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Check permission error:', error);
      return false;
    }
  }
}
