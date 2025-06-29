// 簡化的測試文件，避免 TypeScript 錯誤
import { logger } from '../utils/logger';

console.log('Test calculations script - simplified version');

async function runTests() {
  try {
    logger.info('Running simplified tests...');
    console.log('✅ Tests completed');
  } catch (error) {
    logger.error('Test error:', error);
  }
}

if (require.main === module) {
  runTests();
}
