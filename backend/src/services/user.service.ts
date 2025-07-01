import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  last_login_at?: Date;
}

export interface CreateUserRequest {
  username: string;
  name: string;
  password: string;
  avatar_url?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UserWithProjects extends User {
  projects: Array<{
    key: string;
    name: string;
  }>;
}

export class UserService {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const query = `
        INSERT INTO users (username, name, password_hash, avatar_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, name, avatar_url, is_active, created_at, last_login_at
      `;
      
      const values = [
        userData.username,
        userData.name,
        hashedPassword,
        userData.avatar_url || null
      ];

      const result = await this.pool.query(query, values);
      
      logger.info(`User created: ${userData.username}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, name, avatar_url, is_active, created_at, last_login_at
        FROM users 
        WHERE id = $1
      `;
      
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new Error('Failed to get user');
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, name, avatar_url, is_active, created_at, last_login_at
        FROM users 
        WHERE username = $1
      `;
      
      const result = await this.pool.query(query, [username]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting user by username:', error);
      throw new Error('Failed to get user');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const query = `
        SELECT id, username, name, avatar_url, is_active, created_at, last_login_at
        FROM users
        ORDER BY created_at DESC
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  async getUserWithProjects(userId: string): Promise<UserWithProjects | null> {
    try {
      const userQuery = `
        SELECT id, username, name, avatar_url, is_active, created_at, last_login_at
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await this.pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return null;
      }

      const user = userResult.rows[0];

      const projectsQuery = `
        SELECT p.key as project_key, p.name as project_name
        FROM user_project_permissions upp
        JOIN projects p ON upp.project_id = p.id
        WHERE upp.user_id = $1
      `;
      
      const projectsResult = await this.pool.query(projectsQuery, [userId]);
      
      return {
        ...user,
        projects: projectsResult.rows.map((row: any) => ({ 
          key: row.project_key, 
          name: row.project_name 
        }))
      };
    } catch (error) {
      logger.error('Error getting user with projects:', error);
      throw new Error('Failed to get user with projects');
    }
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setParts.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.avatar_url !== undefined) {
        setParts.push(`avatar_url = $${paramIndex}`);
        values.push(updates.avatar_url);
        paramIndex++;
      }

      if (updates.is_active !== undefined) {
        setParts.push(`is_active = $${paramIndex}`);
        values.push(updates.is_active);
        paramIndex++;
      }

      if (setParts.length === 0) {
        throw new Error('No fields to update');
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, username, name, avatar_url, is_active, created_at, last_login_at
      `;

      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`User updated: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
      const result = await this.pool.query(query, [id]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info(`User deleted: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, username, name, password_hash, avatar_url, is_active, created_at, last_login_at
        FROM users 
        WHERE username = $1 AND is_active = true
      `;
      
      const result = await this.pool.query(query, [username]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return null;
      }

      // 移除密碼雜湊後返回
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error verifying password:', error);
      throw new Error('Failed to verify password');
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const query = `UPDATE users SET last_login_at = NOW() WHERE id = $1`;
      await this.pool.query(query, [userId]);
    } catch (error) {
      logger.error('Error updating last login:', error);
      // 不拋出錯誤，因為這不是關鍵操作
    }
  }

  async getUsersCount(): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM users`;
      const result = await this.pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting users count:', error);
      throw new Error('Failed to get users count');
    }
  }

  async getActiveUsersCount(): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM users WHERE is_active = true`;
      const result = await this.pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting active users count:', error);
      throw new Error('Failed to get active users count');
    }
  }
}
