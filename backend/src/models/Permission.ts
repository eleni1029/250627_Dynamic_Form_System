// backend/src/models/Permission.ts
import { Pool } from 'pg';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

export class PermissionModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 授予用戶專案權限
  async grantPermission(userId: string, projectId: string, grantedBy: string = 'admin'): Promise<boolean> {
    try {
      const query = `
        INSERT INTO user_project_permissions (user_id, project_id, granted_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, project_id) DO NOTHING
        RETURNING id
      `;
      
      const result = await this.pool.query(query, [userId, projectId, grantedBy]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error granting permission:', error);
      throw new Error('Failed to grant permission');
    }
  }

  // 撤銷用戶專案權限
  async revokePermission(userId: string, projectId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM user_project_permissions WHERE user_id = $1 AND project_id = $2';
      const result = await this.pool.query(query, [userId, projectId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error revoking permission:', error);
      throw new Error('Failed to revoke permission');
    }
  }

  // 檢查用戶是否有專案權限
  async hasPermission(userId: string, projectKey: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM user_project_permissions upp
        JOIN projects p ON upp.project_id = p.id
        WHERE upp.user_id = $1 AND p.project_key = $2 AND p.is_active = true
      `;
      
      const result = await this.pool.query(query, [userId, projectKey]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking permission:', error);
      throw new Error('Failed to check permission');
    }
  }

  // 獲取所有權限設定
  async getAllPermissions(page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      // 獲取總數
      const countQuery = `
        SELECT COUNT(*) FROM user_project_permissions upp
        JOIN users u ON upp.user_id = u.id
        JOIN projects p ON upp.project_id = p.id
      `;
      const countResult = await this.pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      // 獲取權限列表
      const query = `
        SELECT 
          upp.user_id,
          upp.project_id,
          u.username,
          u.name as user_name,
          p.project_key,
          p.project_name,
          upp.granted_at,
          upp.granted_by
        FROM user_project_permissions upp
        JOIN users u ON upp.user_id = u.id
        JOIN projects p ON upp.project_id = p.id
        ORDER BY upp.granted_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await this.pool.query(query, [limit, offset]);

      return {
        permissions: result.rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw new Error('Failed to get permissions');
    }
  }

  // 獲取用戶的所有權限
  async getUserPermissions(userId: string) {
    try {
      const query = `
        SELECT 
          p.id as project_id,
          p.project_key,
          p.project_name,
          p.description,
          upp.granted_at,
          upp.granted_by
        FROM user_project_permissions upp
        JOIN projects p ON upp.project_id = p.id
        WHERE upp.user_id = $1 AND p.is_active = true
        ORDER BY p.project_name
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw new Error('Failed to get user permissions');
    }
  }
}

// ===== BMI 記錄模型 =====
// backend/src/models/projects/BMIRecord.ts
import { Pool } from 'pg';
import { getPool } from '../../config/database';
import { BMIRecord, BMICalculationRequest } from '../../types/project.types';
import { logger } from '../../utils/logger';

export class BMIRecordModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 創建 BMI 記錄
  async create(userId: string, data: BMICalculationRequest): Promise<BMIRecord> {
    try {
      const query = `
        INSERT INTO bmi_records (user_id, height, weight, age, gender)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        userId,
        data.height,
        data.weight,
        data.age || null,
        data.gender || null
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating BMI record:', error);
      throw new Error('Failed to create BMI record');
    }
  }

  // 獲取用戶的 BMI 記錄列表
  async getUserRecords(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ) {
    try {
      const offset = (page - 1) * limit;

      // 獲取總數
      const countQuery = 'SELECT COUNT(*) FROM bmi_records WHERE user_id = $1';
      const countResult = await this.pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);

      // 獲取記錄列表
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [userId, limit, offset]);

      return {
        records: result.rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting BMI records:', error);
      throw new Error('Failed to get BMI records');
    }
  }

  // 獲取單一記錄
  async getById(id: string, userId?: string): Promise<BMIRecord | null> {
    try {
      let query = 'SELECT * FROM bmi_records WHERE id = $1';
      const values: any[] = [id];

      if (userId) {
        query += ' AND user_id = $2';
        values.push(userId);
      }

      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting BMI record by id:', error);
      throw new Error('Failed to get BMI record');
    }
  }

  // 刪除記錄
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM bmi_records WHERE id = $1 AND user_id = $2';
      const result = await this.pool.query(query, [id, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  // 獲取用戶最新的 BMI 記錄
  async getLatestRecord(userId: string): Promise<BMIRecord | null> {
    try {
      const query = `
        SELECT * FROM bmi_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting latest BMI record:', error);
      throw new Error('Failed to get latest BMI record');
    }
  }
}

// ===== TDEE 記錄模型 =====
// backend/src/models/projects/TDEERecord.ts
import { Pool } from 'pg';
import { getPool } from '../../config/database';
import { TDEERecord, TDEECalculationRequest } from '../../types/project.types';
import { logger } from '../../utils/logger';

export class TDEERecordModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 創建 TDEE 記錄
  async create(userId: string, data: TDEECalculationRequest): Promise<TDEERecord> {
    try {
      const query = `
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        userId,
        data.height,
        data.weight,
        data.age,
        data.gender,
        data.activity_level
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating TDEE record:', error);
      throw new Error('Failed to create TDEE record');
    }
  }

  // 獲取用戶的 TDEE 記錄列表
  async getUserRecords(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ) {
    try {
      const offset = (page - 1) * limit;

      // 獲取總數
      const countQuery = 'SELECT COUNT(*) FROM tdee_records WHERE user_id = $1';
      const countResult = await this.pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);

      // 獲取記錄列表
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [userId, limit, offset]);

      return {
        records: result.rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting TDEE records:', error);
      throw new Error('Failed to get TDEE records');
    }
  }

  // 獲取單一記錄
  async getById(id: string, userId?: string): Promise<TDEERecord | null> {
    try {
      let query = 'SELECT * FROM tdee_records WHERE id = $1';
      const values: any[] = [id];

      if (userId) {
        query += ' AND user_id = $2';
        values.push(userId);
      }

      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting TDEE record by id:', error);
      throw new Error('Failed to get TDEE record');
    }
  }

  // 刪除記錄
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM tdee_records WHERE id = $1 AND user_id = $2';
      const result = await this.pool.query(query, [id, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting TDEE record:', error);
      throw new Error('Failed to delete TDEE record');
    }
  }

  // 獲取用戶最新的 TDEE 記錄
  async getLatestRecord(userId: string): Promise<TDEERecord | null> {
    try {
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting latest TDEE record:', error);
      throw new Error('Failed to get latest TDEE record');
    }
  }
}