// backend/src/config/projects.config.ts
import { BMI_PROJECT_CONFIG, registerBMIModule } from '../projects/bmi';
import { TDEE_PROJECT_CONFIG, registerTDEEModule } from '../projects/tdee';

// 所有專案模組配置
export const PROJECT_CONFIGS = {
  bmi: BMI_PROJECT_CONFIG,
  tdee: TDEE_PROJECT_CONFIG
} as const;

// 專案模組註冊函數
export const registerAllProjectModules = (app: any): void => {
  console.log('🚀 Registering project modules...');
  
  try {
    // 註冊 BMI 模組
    registerBMIModule(app);
    
    // 註冊 TDEE 模組
    registerTDEEModule(app);
    
    console.log('✅ All project modules registered successfully');
    console.log('📊 Available projects:', Object.keys(PROJECT_CONFIGS));
    
  } catch (error) {
    console.error('❌ Error registering project modules:', error);
    throw error;
  }
};

// 獲取用戶可訪問的專案列表
export const getUserAccessibleProjects = (userPermissions: string[]) => {
  const accessibleProjects = [];
  
  for (const [key, config] of Object.entries(PROJECT_CONFIGS)) {
    // 檢查用戶是否有訪問該專案的權限
    const hasPermission = config.permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (hasPermission && config.isActive) {
      accessibleProjects.push({
        key: config.key,
        name: config.name,
        name_zh: config.name_zh,
        description: config.description,
        description_zh: config.description_zh,
        icon: config.icon,
        route: config.route
      });
    }
  }
  
  return accessibleProjects;
};

// 驗證專案是否存在且用戶有權限訪問
export const validateProjectAccess = (projectKey: string, userPermissions: string[]): boolean => {
  const project = PROJECT_CONFIGS[projectKey as keyof typeof PROJECT_CONFIGS];
  
  if (!project || !project.isActive) {
    return false;
  }
  
  return project.permissions.some(permission => 
    userPermissions.includes(permission)
  );
};