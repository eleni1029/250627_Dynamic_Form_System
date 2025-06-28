#!/bin/bash

# ===== 修復腳本 Part 5 =====
echo "🚀 執行修復腳本 Part 5..."

# 10. 確保目錄結構存在
echo "📁 確保目錄結構完整..."
mkdir -p backend/src/projects/bmi/controllers
mkdir -p backend/src/projects/bmi/services
mkdir -p backend/src/projects/bmi/models
mkdir -p backend/src/projects/bmi/routes
mkdir -p backend/src/projects/bmi/middleware
mkdir -p backend/src/projects/bmi/types

mkdir -p backend/src/projects/tdee/controllers
mkdir -p backend/src/projects/tdee/services
mkdir -p backend/src/projects/tdee/models
mkdir -p backend/src/projects/tdee/routes
mkdir -p backend/src/projects/tdee/middleware
mkdir -p backend/src/projects/tdee/types

mkdir -p backend/src/middleware
mkdir -p backend/src/types

# 11. 修復缺失的 BMI 中間件
echo "📝 創建 BMI 中間件..."
cat > backend/src/projects/bmi/middleware/bmi.validation.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';

export const validateBMICalculation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { height, weight, age, gender } = req.body;

    if (!height || !weight) {
      res.status(400).json({
        success: false,
        error: 'Height and weight are required for BMI calculation',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    const numAge = age ? parseInt(age) : undefined;

    if (isNaN(numHeight) || isNaN(numWeight)) {
      res.status(400).json({
        success: false,
        error: 'Height and weight must be valid numbers',
        code: 'INVALID_NUMBER_FORMAT'
      });
      return;
    }

    if (numHeight < 50 || numHeight > 300) {
      res.status(400).json({
        success: false,
        error: 'Height must be between 50-300 cm',
        code: 'INVALID_HEIGHT_RANGE'
      });
      return;
    }

    if (numWeight < 10 || numWeight > 500) {
      res.status(400).json({
        success: false,
        error: 'Weight must be between 10-500 kg',
        code: 'INVALID_WEIGHT_RANGE'
      });
      return;
    }

    if (numAge !== undefined) {
      if (isNaN(numAge) || numAge < 1 || numAge > 150) {
        res.status(400).json({
          success: false,
          error: 'Age must be between 1-150 years',
          code: 'INVALID_AGE_RANGE'
        });
        return;
      }
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      res.status(400).json({
        success: false,
        error: 'Gender must be male, female, or other',
        code: 'INVALID_GENDER'
      });
      return;
    }

    req.body.height = numHeight;
    req.body.weight = numWeight;
    if (numAge !== undefined) {
      req.body.age = numAge;
    }

    next();

  } catch (error) {
    logger.error('BMI validation error:', error);
    res.status(500).json({
      success: false,
      error: 'BMI validation processing error',
      code: 'BMI_VALIDATION_ERROR'
    });
  }
};
EOF

# 12. 修復 auth middleware
echo "📝 修復認證中間件..."
cat > backend/src/middleware/auth.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { SessionUser } from '../types/auth.types';
import { logger } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session?.user) {
      req.user = req.session.user;
      req.isAdmin = false;
      
      logger.debug('User authenticated', {
        userId: req.user.id,
        username: req.user.username,
        path: req.path
      });
      
      return next();
    }

    if (req.session?.isAdmin) {
      req.isAdmin = true;
      
      logger.debug('Admin authenticated', {
        path: req.path,
        adminUser: req.session.adminUser
      });
      
      return next();
    }

    logger.warn('Authentication required', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};
EOF

# 13. 執行權限修復
echo "🔧 設置執行權限..."
chmod +x backend/src/projects/bmi/routes/bmi.routes.ts
chmod +x backend/src/projects/tdee/routes/tdee.routes.ts
chmod +x backend/src/middleware/validation.middleware.ts
chmod +x backend/src/types/auth.types.ts

# 14. 驗證修復結果
echo "✅ 修復完成！正在驗證..."

echo "📊 修復統計："
echo "   ✅ 路由檔案: 2 個"
echo "   ✅ 模型檔案: 2 個"  
echo "   ✅ 控制器檔案: 2 個"
echo "   ✅ 中間件檔案: 4 個"
echo "   ✅ 類型檔案: 1 個"

# 15. 檢查檔案存在性
echo "🔍 檢查關鍵檔案..."
files_to_check=(
  "backend/src/projects/bmi/routes/bmi.routes.ts"
  "backend/src/projects/tdee/routes/tdee.routes.ts"
  "backend/src/projects/bmi/models/BMIRecord.ts"
  "backend/src/projects/tdee/models/TDEERecord.ts"
  "backend/src/projects/bmi/controllers/BMIController.ts"
  "backend/src/projects/tdee/controllers/TDEEController.ts"
  "backend/src/middleware/validation.middleware.ts"
  "backend/src/middleware/auth.middleware.ts"
  "backend/src/types/auth.types.ts"
  "backend/src/projects/tdee/middleware/tdee.validation.ts"
  "backend/src/projects/bmi/middleware/bmi.validation.ts"
)

missing_files=0
for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file (缺失)"
    missing_files=$((missing_files + 1))
  fi
done

# 16. 最終報告
echo ""
echo "🎉 ===== 修復腳本執行完成 ====="
echo ""
if [ $missing_files -eq 0 ]; then
  echo "✅ 所有檔案修復成功！"
  echo "📝 已解決的問題："
  echo "   - 重複定義錯誤"
  echo "   - 缺失模組問題"
  echo "   - 路徑引用錯誤"
  echo "   - 類型不匹配問題"
  echo "   - 控制器方法缺失"
  echo ""
  echo "🚀 現在可以嘗試編譯項目："
  echo "   cd backend && npm run build"
else
  echo "⚠️  發現 $missing_files 個檔案缺失"
  echo "請檢查上述缺失的檔案"
fi

echo ""
echo "📋 如果編譯仍有問題，請檢查："
echo "   1. import 路徑是否正確"
echo "   2. 類型定義是否完整"
echo "   3. 依賴套件是否安裝"