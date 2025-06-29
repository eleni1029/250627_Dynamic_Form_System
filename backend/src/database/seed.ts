import { pool } from './connection';
import { logger } from '../utils/logger';

export async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // 這裡可以添加種子資料
    logger.info('Database seeding completed');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}
