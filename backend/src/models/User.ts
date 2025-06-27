// backend/src/models/User.ts - 修復版本（延遲初始化）
import { Pool } from 'pg';
import { getPool, isDatabaseConnected } from '../config/database';
import { User, UserWithPassword, CreateUserRequest, UpdateUserRequest } from '../types/user.types';
import { logger } from '../utils/logger';

export class UserModel {
  private pool: Pool | null = null;

  constructor() {
    // 不在構造函數中獲取 pool，而是在需要時獲取
  }

  // 獲取資料庫連接池的私有方法
  private getDbPool(): Pool {
    if (!this.pool) {
      if (!isDatabaseConnected()) {
        throw new Error('Database not connected. Please ensure database connection is established.');
      }
      this.pool = getPool();
    }
    return this.pool;
  }

  // 根據用戶名查找用戶（包含密碼）
  async findByUsername(username: string): Promise<UserWithPassword | null> {
    try {
      const pool = this.getDbPool();
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw new Error('Database query failed');
    }
  }

  // 根據 ID 查找用戶（不包含密碼）
  async findById(id: string): Promise<User | null> {
    try {
      const pool = this.getDbPool();
      const query = `
        SELECT id, username, name, avatar_url, is_active, created_at, updated_at 
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by id:', error);
      throw new Error('Database query failed');
    }
  }

  // 創建新用戶
  async create(userData: CreateUserRequest & { password_hash: string }): Promise<User> {
    try {
      const pool = this.getDbPool();
      const query = `
        INSERT INTO users (username, password_hash, name, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, name, avatar_url, is_active, created_at, updated_at
      `;
      
      const values = [
        userData.username,
        userData.password_hash,
        userData.name,
        userData.is_active ?? true
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating user:', error);
      
      // 處理重複用戶名錯誤
      if (error.code === '23505' && error.constraint === 'users_username_key') {
        throw new Error('Username already exists');
      }
      
      throw new Error('Failed to create user');
    }
  }

  // 更新用戶資訊
  async update(id: string, userData: UpdateUserRequest & { password_hash?: string }): Promise<User | null> {
    try {
      const pool = this.getDbPool();
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (userData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(userData.name);
      }

      if (userData.password_hash !== undefined) {
        updateFields.push(`password_hash = $${paramCount++}`);
        values.push(userData.password_hash);
      }

      if (userData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramCount++}`);
        values.push(userData.is_active);
      }

      if (updateFields.length === 0) {
        return this.findById(id);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING id, username, name, avatar_url, is_active, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // 更新用戶頭像
  async updateAvatar(id: string, avatarUrl: string): Promise<User | null> {
    try {
      const pool = this.getDbPool();
      const query = `
        UPDATE users 
        SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING id, username, name, avatar_url, is_active, created_at, updated_at
      `;
      
      const result = await pool.query(query, [avatarUrl, id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user avatar:', error);
      throw new Error('Failed to update avatar');
    }
  }

  // 獲取用戶列表（分頁）
  async getList(page: number = 1, limit: number = 20, sort: string = 'created_at', order: 'asc' | 'desc' = 'desc') {
    try {
      const pool = this.getDbPool();
      const offset = (page - 1) * limit;
      const allowedSortFields = ['username', 'name', 'created_at', 'updated_at', 'is_active'];
      const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';

      // 獲取總數
      const countQuery = 'SELECT COUNT(*) FROM users';
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      // 獲取用戶列表
      const query = `
        SELECT id, username, name, avatar_url, is_active, created_at, updated_at
        FROM users
        ORDER BY ${sortField} ${order.toUpperCase()}
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limit, offset]);

      return {
        users: result.rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting user list:', error);
      throw new Error('Failed to get user list');
    }
  }

  // 刪除用戶
  async delete(id: string): Promise<boolean> {
    try {
      const pool = this.getDbPool();
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // 檢查用戶名是否存在
  async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    try {
      const pool = this.getDbPool();
      let query = 'SELECT id FROM users WHERE username = $1';
      const values: any[] = [username];

      if (excludeId) {
        query += ' AND id != $2';
        values.push(excludeId);
      }

      const result = await pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking username existence:', error);
      throw new Error('Database query failed');
    }
  }

  // 獲取用戶的專案權限
  async getUserPermissions(userId: string) {
    try {
      const pool = this.getDbPool();
      const query = `
        SELECT 
          p.project_key,
          p.project_name,
          upp.granted_at
        FROM user_project_permissions upp
        JOIN projects p ON upp.project_id = p.id
        WHERE upp.user_id = $1 AND p.is_active = true
        ORDER BY p.project_name
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw new Error('Failed to get user permissions');
    }
  }
}