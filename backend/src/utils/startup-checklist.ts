// backend/src/utils/startup-checklist.ts
import { getPool } from '../config/database';
import { PROJECT_CONFIGS } from '../config/projects.config';

export interface StartupCheckResult {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export const runStartupChecklist = async (): Promise<StartupCheckResult[]> => {
  const results: StartupCheckResult[] = [];
  
  try {
    // 1. 檢查環境變數
    const requiredEnvVars = ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'SESSION_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === 0) {
      results.push({
        step: 'Environment Variables',
        status: 'success',
        message: 'All required environment variables are set'
      });
    } else {
      results.push({
        step: 'Environment Variables',
        status: 'error',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`
      });
    }

    // 2. 檢查資料庫連接
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      results.push({
        step: 'Database Connection',
        status: 'success',
        message: 'Database connection established'
      });
    } catch (error) {
      results.push({
        step: 'Database Connection',
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // 3. 檢查專案模組配置
    const configuredProjects = Object.keys(PROJECT_CONFIGS);
    if (configuredProjects.length > 0) {
      results.push({
        step: 'Project Modules',
        status: 'success',
        message: `${configuredProjects.length} project modules configured: ${configuredProjects.join(', ')}`
      });
    } else {
      results.push({
        step: 'Project Modules',
        status: 'warning',
        message: 'No project modules configured'
      });
    }

  } catch (error) {
    results.push({
      step: 'Startup Check',
      status: 'error',
      message: `Startup check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
};

export const displayStartupResults = (results: StartupCheckResult[]): void => {
  console.log('\n🔍 Startup Checklist Results:');
  console.log('================================');

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
  });

  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const successCount = results.filter(r => r.status === 'success').length;

  console.log('\n📊 Summary:');
  console.log(`   Success: ${successCount}`);
  console.log(`   Warning: ${warningCount}`);
  console.log(`   Error: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n❌ Application startup may have issues.');
  } else if (warningCount > 0) {
    console.log('\n⚠️ Application started with warnings.');
  } else {
    console.log('\n✅ All startup checks passed successfully!');
  }
  console.log('================================\n');
};