// Dynamic Form System Projects Configuration

export interface ProjectConfig {
  key: string;
  name: string;
  description: string;
  version: string;
  path: string;
  permissions: string[];
}

// BMI 專案配置
export const BMI_PROJECT_CONFIG: ProjectConfig = {
  key: 'bmi',
  name: 'BMI Calculator',
  description: 'Body Mass Index Calculator',
  version: '1.0.0',
  path: '/projects/bmi',
  permissions: ['bmi:read', 'bmi:write']
};

// TDEE 專案配置
export const TDEE_PROJECT_CONFIG: ProjectConfig = {
  key: 'tdee',
  name: 'TDEE Calculator',
  description: 'Total Daily Energy Expenditure Calculator',
  version: '1.0.0',
  path: '/projects/tdee',
  permissions: ['tdee:read', 'tdee:write']
};

// 所有專案配置
export const PROJECT_CONFIGS: ProjectConfig[] = [
  BMI_PROJECT_CONFIG,
  TDEE_PROJECT_CONFIG
];

// 檢查用戶權限
export function hasProjectPermission(
  userPermissions: string[],
  projectKey: string,
  action: string = 'read'
): boolean {
  const config = PROJECT_CONFIGS.find(p => p.key === projectKey);
  if (!config) return false;

  const hasPermission = config.permissions.some((permission: string) =>
    userPermissions.includes(permission) || 
    userPermissions.includes(`${projectKey}:${action}`)
  );

  return hasPermission;
}

// 獲取用戶可訪問的專案
export function getUserAccessibleProjects(userPermissions: string[]): ProjectConfig[] {
  return PROJECT_CONFIGS.filter(project => 
    project.permissions.some((permission: string) =>
      userPermissions.includes(permission)
    )
  );
}
