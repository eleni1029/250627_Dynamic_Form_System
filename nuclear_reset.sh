#!/bin/bash

echo "💥 核彈級重置 - 回到純淨狀態..."

# 1. 完全刪除有問題的檔案和目錄
echo "🗑️ 刪除所有損壞檔案..."

# 刪除整個 projects 目錄
rm -rf backend/src/projects/

# 刪除有問題的核心檔案
rm -f backend/src/types/auth.types.ts
rm -f backend/src/middleware/validation.middleware.ts
rm -f backend/src/middleware/auth.middleware.ts

# 刪除有重複內容的檔案
rm -f backend/src/models/Permission.ts
rm -f backend/src/models/User.ts
rm -f backend/src/models/ActivityLog.ts

# 2. 重建最小可用結構
echo "🏗️ 重建最小結構..."

# 重建 projects 目錄
mkdir -p backend/src/projects/bmi/{controllers,routes,models,services,types,middleware}
mkdir -p backend/src/projects/tdee/{controllers,routes,models,services,types,middleware}

# 3. 創建最簡單的類型檔案
echo "📝 創建基礎類型..."
cat > backend/src/types/auth.types.ts << 'EOF'
import { Request } from 'express';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser extends User {}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
  isAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      isAdmin?: boolean;
    }
  }
}
EOF

# 4. 創建最簡單的中間件
echo "📝 創建基礎中間件..."
cat > backend/src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  
  return res.status(401).json({
    success: false,
    error: 'Authentication required'
  });
};
EOF

cat > backend/src/middleware/validation.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';

export const validateBodyMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const { height, weight } = req.body;
  
  if (!height || !weight) {
    res.status(400).json({
      success: false,
      error: 'Height and weight are required'
    });
    return;
  }
  
  next();
};
EOF

# 5. 創建 BMI 類型
echo "📝 創建 BMI 類型..."
cat > backend/src/projects/bmi/types/bmi.types.ts << 'EOF'
export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  category_en: string;
  isHealthy: boolean;
  recommendations: string[];
  healthRisk: string;
}

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age?: number;
  gender?: string;
  created_at: Date;
}

export interface BMIApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface BMIHistoryQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
EOF

# 6. 創建簡單的 BMI 路由
echo "📝 創建 BMI 路由..."
cat > backend/src/projects/bmi/routes/bmi.routes.ts << 'EOF'
import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBodyMetrics } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  
  router.use(authMiddleware);
  
  router.post('/calculate', validateBodyMetrics, (req, res) => {
    res.json({ success: true, message: 'BMI endpoint working' });
  });
  
  return router;
};
EOF

# 7. 創建簡單的 BMI index
echo "📝 創建 BMI index..."
cat > backend/src/projects/bmi/index.ts << 'EOF'
import { createBMIRoutes } from './routes/bmi.routes';

export const BMI_PROJECT_CONFIG = {
  key: 'bmi',
  name: 'BMI Calculator',
  route: '/api/projects/bmi',
  isActive: true
};

export const registerBMIModule = (app: any): void => {
  const bmiRoutes = createBMIRoutes();
  app.use('/api/projects/bmi', bmiRoutes);
  console.log('✅ BMI module registered');
};

export * from './types/bmi.types';
EOF

# 8. 檢查編譯
echo "✅ 重置完成！"
echo "🔄 測試最小編譯："
echo "cd backend && npm run build"

# 顯示已創建的檔案
echo ""
echo "📁 已創建的檔案："
echo "   ✅ backend/src/types/auth.types.ts"
echo "   ✅ backend/src/middleware/auth.middleware.ts" 
echo "   ✅ backend/src/middleware/validation.middleware.ts"
echo "   ✅ backend/src/projects/bmi/types/bmi.types.ts"
echo "   ✅ backend/src/projects/bmi/routes/bmi.routes.ts"
echo "   ✅ backend/src/projects/bmi/index.ts"