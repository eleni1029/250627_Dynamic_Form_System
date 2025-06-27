// backend/src/models/ActivityLog.ts
import { Pool } from 'pg';
import { getPool } from '../config/database';
import { ActivityLog, CreateActivityLogRequest } from '../types/project.types';
import { logger } from '../utils/logger';

export class ActivityLogModel {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 創建活動記錄
  async create(data: CreateActivityLogRequest): Promise<ActivityLog> {
    try {
      const query = `
        INSERT INTO activity_logs (user_id, action_type, action_description, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        data.user_id || null,
        data.action_type,
        data.action_description || null,
        data.ip_address || null,
        data.user_agent || null
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating activity log:', error);
      throw new Error('Failed to create activity log');
    }
  }

  // 獲取活動記錄列表（管理員用）
  async getList(
    page: number = 1, 
    limit: number = 20,
    userId?: string,
    actionType?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions: string[] = [];
      let values: any[] = [];
      let paramCount = 1;

      // 構建 WHERE 條件
      if (userId) {
        whereConditions.push(`al.user_id = $${paramCount++}`);
        values.push(userId);
      }

      if (actionType) {
        whereConditions.push(`al.action_type = $${paramCount++}`);
        values.push(actionType);
      }

      if (startDate) {
        whereConditions.push(`al.created_at >= $${paramCount++}`);
        values.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`al.created_at <= $${paramCount++}`);
        values.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 獲取總數
      const countQuery = `
        SELECT COUNT(*) FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
      `;
      const countResult = await this.pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // 獲取記錄列表
      const query = `
        SELECT 
          al.*,
          u.username,
          u.name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;

      values.push(limit, offset);
      const result = await this.pool.query(query, values);

      return {
        logs: result.rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting activity logs:', error);
      throw new Error('Failed to get activity logs');
    }
  }

  // 獲取用戶的活動記錄
  async getUserLogs(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    actionType?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = ['user_id = $1'];
      let values: any[] = [userId];
      let paramCount = 2;

      if (actionType) {
        whereConditions.push(`action_type = ${paramCount++}`);
        values.push(actionType);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // 獲取總數
      const countQuery = `SELECT COUNT(*) FROM activity_logs ${whereClause}`;
      const countResult = await this.pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // 獲取記錄列表
      const query = `
        SELECT * FROM activity_logs 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${paramCount++} OFFSET ${paramCount++}
      `;

      values.push(limit, offset);
      const result = await this.pool.query(query, values);

      return {
        logs: result.rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting user activity logs:', error);
      throw new Error('Failed to get user activity logs');
    }
  }

  // 清理舊的活動記錄（保留最近 N 天）
  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const query = 'DELETE FROM activity_logs WHERE created_at < $1';
      const result = await this.pool.query(query, [cutoffDate]);
      
      logger.info(`Cleaned ${result.rowCount} old activity logs older than ${daysToKeep} days`);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Error cleaning old activity logs:', error);
      throw new Error('Failed to clean old logs');
    }
  }

  // 獲取活動類型統計
  async getActionTypeStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      let whereConditions: string[] = [];
      let values: any[] = [];
      let paramCount = 1;

      if (userId) {
        whereConditions.push(`user_id = ${paramCount++}`);
        values.push(userId);
      }

      if (startDate) {
        whereConditions.push(`created_at >= ${paramCount++}`);
        values.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`created_at <= ${paramCount++}`);
        values.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          action_type,
          COUNT(*) as count,
          DATE_TRUNC('day', created_at) as date
        FROM activity_logs
        ${whereClause}
        GROUP BY action_type, DATE_TRUNC('day', created_at)
        ORDER BY date DESC, count DESC
      `;

      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting action type stats:', error);
      throw new Error('Failed to get action type statistics');
    }
  }

  // 記錄用戶登錄
  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.create({
      user_id: userId,
      action_type: 'USER_LOGIN',
      action_description: 'User logged in successfully',
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  // 記錄用戶登出
  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.create({
      user_id: userId,
      action_type: 'USER_LOGOUT',
      action_description: 'User logged out',
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  // 記錄管理員登錄
  async logAdminLogin(ipAddress?: string, userAgent?: string): Promise<void> {
    await this.create({
      action_type: 'ADMIN_LOGIN',
      action_description: 'Administrator logged in successfully',
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  // 記錄 BMI 計算
  async logBMICalculation(userId: string, recordId: string, ipAddress?: string): Promise<void> {
    await this.create({
      user_id: userId,
      action_type: 'BMI_CALCULATION',
      action_description: `BMI calculation performed, record ID: ${recordId}`,
      ip_address: ipAddress
    });
  }

  // 記錄 TDEE 計算
  async logTDEECalculation(userId: string, recordId: string, ipAddress?: string): Promise<void> {
    await this.create({
      user_id: userId,
      action_type: 'TDEE_CALCULATION',
      action_description: `TDEE calculation performed, record ID: ${recordId}`,
      ip_address: ipAddress
    });
  }

  // 記錄用戶管理操作
  async logUserManagement(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    targetUserId: string,
    adminId?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.create({
      user_id: adminId,
      action_type: `USER_${action}`,
      action_description: `User ${action.toLowerCase()} operation on user ID: ${targetUserId}`,
      ip_address: ipAddress
    });
  }

  // 記錄權限管理操作
  async logPermissionChange(
    action: 'GRANT' | 'REVOKE',
    userId: string,
    projectKey: string,
    adminId?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.create({
      user_id: adminId,
      action_type: `PERMISSION_${action}`,
      action_description: `Permission ${action.toLowerCase()}ed for user ${userId} on project ${projectKey}`,
      ip_address: ipAddress
    });
  }
}

// ===== 常用活動類型常數 =====
export const ActivityTypes = {
  // 用戶相關
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  
  // 管理員相關
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  
  // 專案計算
  BMI_CALCULATION: 'BMI_CALCULATION',
  TDEE_CALCULATION: 'TDEE_CALCULATION',
  
  // 權限管理
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  
  // 系統相關
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING'
} as const;

export type ActivityType = typeof ActivityTypes[keyof typeof ActivityTypes];