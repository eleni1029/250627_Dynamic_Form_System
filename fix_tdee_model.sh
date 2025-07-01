#!/bin/bash

echo "🔧 修復 TDEE Model 的資料庫初始化問題"
echo "=================================="

# ===== 修復 TDEE Model =====
echo "📝 修復 TDEE Model..."

cat > backend/src/projects/tdee/models/TDEERecord.ts << 'EOF'
import { Pool } from 'pg';
import { logger } from '../../../utils/logger';

export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  bmr: number;
  tdee: number;
  activity_factor: number;
  created_at: Date;
  updated_at: Date;
}

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
}

export interface TDEECalculationResult {
  bmr: number;
  tdee: number;
  activity_factor: number;
  activityInfo: {
    level: string;
    multiplier: number;
    description: string;
    name: string;
  };
}

export class TDEEModel {
  private getPool(): Pool {
    // 延遲導入 pool，確保資料庫已連接
    const { pool } = require('../../../database/connection');
    return pool;
  }

  async create(userId: string, data: TDEECalculationRequest & TDEECalculationResult): Promise<TDEERecord> {
    try {
      const query = `
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level, bmr, tdee, activity_factor)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        userId,
        data.height,
        data.weight,
        data.age,
        data.gender,
        data.activity_level,
        data.bmr,
        data.tdee,
        data.activity_factor
      ];

      const result = await this.getPool().query(query, values);
      logger.debug(`TDEE record created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating TDEE record:', error);
      throw new Error('Failed to create TDEE record');
    }
  }

  async findByUserId(userId: string, limit: number = 50): Promise<TDEERecord[]> {
    try {
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await this.getPool().query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding TDEE records:', error);
      throw new Error('Failed to find TDEE records');
    }
  }

  async findLatestByUserId(userId: string): Promise<TDEERecord | null> {
    try {
      const query = `
        SELECT * FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.getPool().query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest TDEE record:', error);
      throw new Error('Failed to get latest TDEE record');
    }
  }

  async delete(recordId: string, userId: string): Promise<boolean> {
    try {
      const query = `DELETE FROM tdee_records WHERE id = $1 AND user_id = $2 RETURNING id`;
      const result = await this.getPool().query(query, [recordId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting TDEE record:', error);
      throw new Error('Failed to delete TDEE record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      const query = `DELETE FROM tdee_records WHERE user_id = $1 RETURNING id`;
      const result = await this.getPool().query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error clearing TDEE history:', error);
      throw new Error('Failed to clear TDEE history');
    }
  }

  async getRecordCount(userId: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM tdee_records WHERE user_id = $1`;
      const result = await this.getPool().query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting TDEE record count:', error);
      throw new Error('Failed to get TDEE record count');
    }
  }

  async getLatestInput(userId: string): Promise<TDEECalculationRequest | null> {
    try {
      const query = `
        SELECT height, weight, age, gender, activity_level 
        FROM tdee_records 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.getPool().query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting latest TDEE input:', error);
      throw new Error('Failed to get latest TDEE input');
    }
  }
}
EOF

# ===== 檢查是否還有其他使用舊 database connection 的文件 =====
echo "🔍 檢查其他可能有問題的文件..."

# 檢查是否還有其他地方直接使用 pool
find backend/src -name "*.ts" -type f -exec grep -l "pool.*=" {} \; 2>/dev/null | while read file; do
  if [[ "$file" != *"database/connection.ts"* ]]; then
    echo "⚠️  發現可能有問題的文件: $file"
  fi
done

echo ""
echo "✅ TDEE Model 修復完成！"
echo ""
echo "🚀 現在重新啟動後端："
echo "cd backend && npm run dev"