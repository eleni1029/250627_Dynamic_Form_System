// backend/src/models/ActivityLog.ts - 修復 IP 地址處理
import { Pool } from 'pg';
import { getPool, isDatabaseConnected } from '../config/database';
import { ActivityLog, CreateActivityLogRequest } from '../types/auth.types';
import { logger } from '../utils/logger';

export class ActivityLogModel {
  private pool: Pool | null = null;

  constructor() {
    // 延遲初始化
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

  // 驗證和清理 IP 地址
  private validateIpAddress(ipAddress?: string): string | null {
    if (!ipAddress) return null;
    
    // 清理 IPv6 包裹的 IPv4 地址
    let cleanIp = ipAddress;
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }
    
    // 處理 localhost
    if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === 'localhost') {
      return '127.0.0.1';
    }
    
    // 簡單的 IP 格式驗證
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(cleanIp) || ipv6Regex.test(cleanIp)) {
      return cleanIp;
    }
    
    // 如果無法解析，返回 null
    logger.warn('Invalid IP address format, setting to null:', { originalIp: ipAddress, cleanedIp: cleanIp });
    return null;
  }

  // 創建活動記錄
  async create(logData: CreateActivityLogRequest): Promise<ActivityLog> {
    try {
      const pool = this.getDbPool();
      
      // 驗證和清理 IP 地址
      const validIpAddress = this.validateIpAddress(logData.ip_address);
      
      const query = `
        INSERT INTO activity_logs (user_id, action_type, action_description, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        logData.user_id || null,
        logData.action_type,
        logData.action_description || null,
        validIpAddress, // 使用驗證後的 IP 地址
        logData.user_agent || null
      ];

      const result = await pool.query(query, values);
      
      logger.debug('Activity log created', {
        action_type: logData.action_type,
        user_id: logData.user_id,
        ip_address: validIpAddress,
        original_ip: logData.ip_address
      });
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating activity log:', {
        error: error.message,
        code: error.code,
        logData: {
          ...logData,
          ip_address: this.validateIpAddress(logData.ip_address)
        }
      });
      throw new Error('Failed to create activity log');
    }
  }

  // 記錄用戶登錄
  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.create({
        user_id: userId,
        action_type: 'USER_LOGIN',
        action_description: 'User logged in successfully',
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      logger.error('Error logging user login:', error);
      // 不拋出錯誤，因為日誌記錄失敗不應該影響登錄流程
    }
  }

  // 記錄用戶登出
  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.create({
        user_id: userId,
        action_type: 'USER_LOGOUT',
        action_description: 'User logged out',
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      logger.error('Error logging user logout:', error);
      // 不拋出錯誤，因為日誌記錄失敗不應該影響登出流程
    }
  }

  // 記錄管理員登錄
  async logAdminLogin(ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.create({
        action_type: 'ADMIN_LOGIN',
        action_description: 'Administrator logged in successfully',
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      logger.error('Error logging admin login:', error);
      // 不拋出錯誤，因為日誌記錄失敗不應該影響登錄流程
    }
  }

  // 記錄管理員登出
  async logAdminLogout(ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.create({
        action_type: 'ADMIN_LOGOUT',
        action_description: 'Administrator logged out',
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      logger.error('Error logging admin logout:', error);
      // 不拋出錯誤，因為日誌記錄失敗不應該影響登出流程
    }
  }

  // 記錄用戶管理操作
  async logUserManagement(action: string, targetUserId: string, details?: string, adminIpAddress?: string): Promise<void> {
    try {
      await this.create({
        action_type: `USER_MANAGEMENT_${action}`,
        action_description: details || `User ${action.toLowerCase()} operation`,
        ip_address: adminIpAddress,
        user_agent: 'Admin Panel'
      });
    } catch (error) {
      logger.error('Error logging user management:', error);
    }
  }

  // 記錄計算器使用
  async logCalculatorUse(userId: string, calculatorType: string, result: any, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.create({
        user_id: userId,
        action_type: `CALCULATOR_${calculatorType.toUpperCase()}`,
        action_description: `Used ${calculatorType} calculator`,
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      logger.error('Error logging calculator use:', error);
    }
  }

  // 獲取活動日誌列表（分頁）
  async getList(page: number = 1, limit: number = 50, userId?: string) {
    try {
      const pool = this.getDbPool();
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          al.*,
          u.username
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
      `;
      
      const params: any[] = [];
      let paramCount = 1;
      
      if (userId) {
        query += ` WHERE al.user_id = $${paramCount++}`;
        params.push(userId);
      }
      
      query += ` ORDER BY al.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // 獲取總數
      let countQuery = 'SELECT COUNT(*) FROM activity_logs';
      const countParams: any[] = [];
      
      if (userId) {
        countQuery += ' WHERE user_id = $1';
        countParams.push(userId);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
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

  // 清理舊記錄（保留最近 90 天）
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const pool = this.getDbPool();
      const query = `
        DELETE FROM activity_logs 
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      `;
      
      const result = await pool.query(query);
      const deletedCount = result.rowCount || 0;
      
      logger.info(`Cleaned up ${deletedCount} old activity logs`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up activity logs:', error);
      throw new Error('Failed to cleanup activity logs');
    }
  }
}