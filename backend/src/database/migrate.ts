import { readFileSync } from 'fs';
import { join } from 'path';
import { connectDatabase, query, closeDatabase } from '../config/database';
import { logger } from '../utils/logger';

async function runMigration() {
  try {
    logger.info('Starting database migration...');
    
    // 連接資料庫
    await connectDatabase();
    
    // 讀取 SQL 初始化文件
    const sqlPath = join(__dirname, 'init.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // 更聰明的 SQL 分割 - 處理多行語句
    const statements = splitSqlStatements(sqlContent);
    
    logger.info(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.trim().length > 5) {
        try {
          await query(statement.trim());
          logger.debug(`Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error: any) {
          // 忽略某些預期的錯誤
          if (error.code === '42P07' || error.code === '42710' || error.code === '42P06') {
            logger.debug(`Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            logger.error(`Error in statement ${i + 1}:`, error.message);
            logger.error(`Statement content: ${statement.substring(0, 200)}...`);
            throw error;
          }
        }
      }
    }
    
    logger.info('Database migration completed successfully');
    
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inFunction = false;
  let dollarQuoteTag = '';
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳過註釋和空行
    if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
      continue;
    }
    
    // 檢查是否進入或退出函數定義
    if (trimmedLine.includes('$$')) {
      if (!inFunction) {
        // 進入函數
        inFunction = true;
        dollarQuoteTag = '$$';
      } else if (trimmedLine.includes(dollarQuoteTag)) {
        // 退出函數
        inFunction = false;
        dollarQuoteTag = '';
      }
    }
    
    currentStatement += line + '\n';
    
    // 如果不在函數內，且行以分號結尾，則認為語句結束
    if (!inFunction && trimmedLine.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // 如果還有剩餘內容，添加最後一個語句
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(stmt => stmt && stmt.length > 0);
}

// 如果直接執行此文件則運行遷移
if (require.main === module) {
  runMigration();
}

export { runMigration };
