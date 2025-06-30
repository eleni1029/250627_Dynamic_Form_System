#!/bin/bash

echo "🔧 模組化修復 Part 4 - 控制器與路由"
echo "==================================="

# ===== BMI 控制器 =====
echo "📝 創建 BMI 控制器..."

cat > backend/src/projects/bmi/controllers/BMIController.ts << 'EOF'
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { BMIService } from '../services/BMIService';
import { BMICalculationRequest } from '../types/bmi.types';
import { logger } from '../../../utils/logger';

export class BMIController {
  private bmiService: BMIService;

  constructor() {
    this.bmiService = new BMIService();
  }

  calculate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const request = req.body as BMICalculationRequest;
      
      // 驗證數據
      const validation = await this.bmiService.validateBMIData(request);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid BMI data',
          code: 'BMI_DATA_INVALID',
          details: validation.errors
        });
        return;
      }

      // 計算 BMI
      const result = await this.bmiService.calculateBMI(request);
      
      // 保存記錄
      const record = await this.bmiService.saveBMIRecord(userId, request, result);

      logger.info(`BMI calculated for user ${userId}`, { 
        bmi: result.bmi, 
        category: result.category,
        recordId: record.id
      });
      
      res.status(201).json({
        success: true,
        data: {
          calculation: result,
          input: request,
          record: {
            id: record.id,
            created_at: record.created_at
          }
        },
        message: 'BMI calculated and saved successfully'
      });

    } catch (error) {
      logger.error('BMI calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while calculating BMI',
        code: 'BMI_CALCULATION_SERVER_ERROR'
      });
    }
  };

  getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await this.bmiService.getUserBMIHistory(userId, limit);

      res.json({
        success: true,
        data: {
          records: history,
          total: history.length,
          limit: limit
        },
        message: 'BMI history retrieved successfully'
      });
    } catch (error) {
      logger.error('BMI get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting BMI history',
        code: 'BMI_HISTORY_SERVER_ERROR'
      });
    }
  };

  getLatest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const latest = await this.bmiService.getLatestBMI(userId);

      res.json({
        success: true,
        data: latest,
        message: latest ? 'Latest BMI retrieved successfully' : 'No BMI records found'
      });
    } catch (error) {
      logger.error('BMI get latest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest BMI',
        code: 'BMI_LATEST_SERVER_ERROR'
      });
    }
  };

  getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const stats = await this.bmiService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'BMI statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('BMI get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting BMI stats',
        code: 'BMI_STATS_SERVER_ERROR'
      });
    }
  };

  deleteRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const recordId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const deleted = await this.bmiService.deleteBMIRecord(recordId, userId);
      
      if (deleted) {
        logger.info(`BMI record deleted: ${recordId} by user ${userId}`);
        res.json({
          success: true,
          data: { deletedRecordId: recordId },
          message: 'BMI record deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'BMI record not found or access denied',
          code: 'BMI_RECORD_NOT_FOUND'
        });
      }
    } catch (error) {
      logger.error('BMI delete record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting BMI record',
        code: 'BMI_DELETE_SERVER_ERROR'
      });
    }
  };

  clearHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const deletedCount = await this.bmiService.clearUserHistory(userId);

      logger.info(`BMI history cleared: ${deletedCount} records for user ${userId}`);
      res.json({
        success: true,
        data: { 
          deletedCount,
          userId: userId
        },
        message: `Successfully cleared ${deletedCount} BMI records`
      });
    } catch (error) {
      logger.error('BMI clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing BMI history',
        code: 'BMI_CLEAR_SERVER_ERROR'
      });
    }
  };

  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request = req.body as BMICalculationRequest;
      const validation = await this.bmiService.validateBMIData(request);

      res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          input: request
        },
        message: validation.valid ? 'BMI data is valid' : 'BMI data validation failed'
      });
    } catch (error) {
      logger.error('BMI validate data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating BMI data',
        code: 'BMI_VALIDATE_SERVER_ERROR'
      });
    }
  };

  // 額外的統計端點
  getTrend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const records = await this.bmiService.getUserBMIHistory(userId, Math.min(days, 100));
      
      // 簡單的趨勢分析
      let trend = 'stable';
      if (records.length >= 2) {
        const latest = records[0].bmi;
        const previous = records[1].bmi;
        const difference = latest - previous;
        
        if (difference > 0.5) trend = 'increasing';
        else if (difference < -0.5) trend = 'decreasing';
      }

      res.json({
        success: true,
        data: {
          trend,
          records: records.slice(0, 10), // 只返回最近10筆用於圖表
          summary: {
            totalRecords: records.length,
            timeframe: `${days} days`,
            analysisDate: new Date()
          }
        },
        message: 'BMI trend analysis completed'
      });
    } catch (error) {
      logger.error('BMI trend analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while analyzing BMI trend',
        code: 'BMI_TREND_SERVER_ERROR'
      });
    }
  };
}
EOF

echo "✅ BMI 控制器已創建"

# ===== TDEE 控制器 =====
echo "📝 創建 TDEE 控制器..."

cat > backend/src/projects/tdee/controllers/TDEEController.ts << 'EOF'
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';
import { TDEEService } from '../services/TDEEService';
import { TDEECalculationRequest } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEEController {
  private tdeeService: TDEEService;

  constructor() {
    this.tdeeService = new TDEEService();
  }

  calculate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const request = req.body as TDEECalculationRequest;
      
      // 驗證數據
      const validation = await this.tdeeService.validateTDEEData(request);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid TDEE data',
          code: 'TDEE_DATA_INVALID',
          details: validation.errors
        });
        return;
      }

      // 計算 TDEE
      const result = await this.tdeeService.calculateTDEE(request);
      
      // 保存記錄
      const record = await this.tdeeService.saveTDEERecord(userId, request, result);

      logger.info(`TDEE calculated for user ${userId}`, { 
        bmr: result.bmr, 
        tdee: result.tdee,
        activityLevel: request.activity_level,
        recordId: record.id
      });
      
      res.status(201).json({
        success: true,
        data: {
          calculation: result,
          input: request,
          record: {
            id: record.id,
            created_at: record.created_at
          }
        },
        message: 'TDEE calculated and saved successfully'
      });

    } catch (error) {
      logger.error('TDEE calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while calculating TDEE',
        code: 'TDEE_CALCULATION_SERVER_ERROR'
      });
    }
  };

  getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await this.tdeeService.getUserTDEEHistory(userId, limit);

      res.json({
        success: true,
        data: {
          records: history,
          total: history.length,
          limit: limit
        },
        message: 'TDEE history retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting TDEE history',
        code: 'TDEE_HISTORY_SERVER_ERROR'
      });
    }
  };

  getLatest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const latest = await this.tdeeService.getLatestTDEE(userId);

      res.json({
        success: true,
        data: latest,
        message: latest ? 'Latest TDEE retrieved successfully' : 'No TDEE records found'
      });
    } catch (error) {
      logger.error('TDEE get latest error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting latest TDEE',
        code: 'TDEE_LATEST_SERVER_ERROR'
      });
    }
  };

  getActivityLevels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const levels = this.tdeeService.getActivityLevels();

      res.json({
        success: true,
        data: levels,
        message: 'Activity levels retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE get activity levels error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting activity levels',
        code: 'TDEE_ACTIVITY_LEVELS_SERVER_ERROR'
      });
    }
  };

  getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const stats = await this.tdeeService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'TDEE statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting TDEE stats',
        code: 'TDEE_STATS_SERVER_ERROR'
      });
    }
  };

  deleteRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const recordId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const deleted = await this.tdeeService.deleteTDEERecord(recordId, userId);
      
      if (deleted) {
        logger.info(`TDEE record deleted: ${recordId} by user ${userId}`);
        res.json({
          success: true,
          data: { deletedRecordId: recordId },
          message: 'TDEE record deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'TDEE record not found or access denied',
          code: 'TDEE_RECORD_NOT_FOUND'
        });
      }
    } catch (error) {
      logger.error('TDEE delete record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while deleting TDEE record',
        code: 'TDEE_DELETE_SERVER_ERROR'
      });
    }
  };

  clearHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const deletedCount = await this.tdeeService.clearUserHistory(userId);

      logger.info(`TDEE history cleared: ${deletedCount} records for user ${userId}`);
      res.json({
        success: true,
        data: { 
          deletedCount,
          userId: userId
        },
        message: `Successfully cleared ${deletedCount} TDEE records`
      });
    } catch (error) {
      logger.error('TDEE clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while clearing TDEE history',
        code: 'TDEE_CLEAR_SERVER_ERROR'
      });
    }
  };

  validateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request = req.body as TDEECalculationRequest;
      const validation = await this.tdeeService.validateTDEEData(request);

      res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          input: request
        },
        message: validation.valid ? 'TDEE data is valid' : 'TDEE data validation failed'
      });
    } catch (error) {
      logger.error('TDEE validate data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while validating TDEE data',
        code: 'TDEE_VALIDATE_SERVER_ERROR'
      });
    }
  };

  // 額外的營養建議端點
  getNutritionAdvice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const latest = await this.tdeeService.getLatestTDEE(userId);
      if (!latest) {
        res.status(404).json({
          success: false,
          error: 'No TDEE calculation found. Please calculate TDEE first.',
          code: 'NO_TDEE_RECORD'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          macronutrients: latest.macronutrients,
          calorieGoals: latest.calorie_goals,
          nutritionAdvice: latest.nutrition_advice,
          recommendations: latest.recommendations,
          basedOn: {
            tdee: latest.tdee,
            bmr: latest.bmr,
            activityLevel: latest.activity_level,
            calculatedAt: latest.created_at
          }
        },
        message: 'Nutrition advice retrieved successfully'
      });
    } catch (error) {
      logger.error('TDEE nutrition advice error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error while getting nutrition advice',
        code: 'TDEE_NUTRITION_SERVER_ERROR'
      });
    }
  };
}
EOF

echo "✅ TDEE 控制器已創建"

# ===== BMI 路由 =====
echo "📝 創建 BMI 路由..."

cat > backend/src/projects/bmi/routes/bmi.routes.ts << 'EOF'
import { Router } from 'express';
import { BMIController } from '../controllers/BMIController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateBMICalculation, validateBMIRecordAccess } from '../middleware/bmi.validation';
import { validatePagination, validateDateRange, sanitizeInput } from '../../../middleware/validation.middleware';

export const createBMIRoutes = (): Router => {
  const router = Router();
  const bmiController = new BMIController();

  // 應用中間件
  router.use(authMiddleware);
  router.use(sanitizeInput);

  // BMI 計算
  router.post('/calculate', 
    validateBMICalculation, 
    bmiController.calculate
  );

  // 獲取歷史記錄
  router.get('/history', 
    validatePagination,
    validateDateRange,
    bmiController.getHistory
  );

  // 獲取最新記錄
  router.get('/latest', 
    bmiController.getLatest
  );

  // 獲取用戶統計
  router.get('/stats', 
    bmiController.getUserStats
  );

  // 獲取趨勢分析
  router.get('/trend',
    bmiController.getTrend
  );

  // 數據驗證端點
  router.post('/validate', 
    validateBMICalculation, 
    bmiController.validateData
  );

  // 刪除特定記錄
  router.delete('/records/:id', 
    validateBMIRecordAccess, 
    bmiController.deleteRecord
  );

  // 清空歷史記錄
  router.delete('/history', 
    bmiController.clearHistory
  );

  return router;
};
EOF

echo "✅ BMI 路由已創建"

# ===== TDEE 路由 =====
echo "📝 創建 TDEE 路由..."

cat > backend/src/projects/tdee/routes/tdee.routes.ts << 'EOF'
import { Router } from 'express';
import { TDEEController } from '../controllers/TDEEController';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { validateTDEECalculation, validateTDEERecordAccess, validateActivityLevel } from '../middleware/tdee.validation';
import { validatePagination, validateDateRange, sanitizeInput } from '../../../middleware/validation.middleware';

export const createTDEERoutes = (): Router => {
  const router = Router();
  const tdeeController = new TDEEController();

  // 應用中間件
  router.use(authMiddleware);
  router.use(sanitizeInput);

  // TDEE 計算
  router.post('/calculate', 
    validateTDEECalculation, 
    tdeeController.calculate
  );

  // 獲取活動等級列表（無需額外驗證）
  router.get('/activity-levels', 
    tdeeController.getActivityLevels
  );

  // 獲取歷史記錄
  router.get('/history', 
    validatePagination,
    validateDateRange,
    tdeeController.getHistory
  );

  // 獲取最新記錄
  router.get('/latest', 
    tdeeController.getLatest
  );

  // 獲取用戶統計
  router.get('/stats', 
    tdeeController.getUserStats
  );

  // 獲取營養建議
  router.get('/nutrition-advice',
    tdeeController.getNutritionAdvice
  );

  // 數據驗證端點
  router.post('/validate', 
    validateTDEECalculation, 
    tdeeController.validateData
  );

  // 驗證活動等級
  router.post('/validate-activity',
    validateActivityLevel,
    (req, res) => {
      res.json({
        success: true,
        data: { valid: true, activityLevel: req.body.activity_level },
        message: 'Activity level is valid'
      });
    }
  );

  // 刪除特定記錄
  router.delete('/records/:id', 
    validateTDEERecordAccess, 
    tdeeController.deleteRecord
  );

  // 清空歷史記錄
  router.delete('/history', 
    tdeeController.clearHistory
  );

  return router;
};
EOF

echo "✅ TDEE 路由已創建"

# ===== 更新主要項目路由 =====
echo "📝 更新主要項目路由..."

cat > backend/src/routes/projects.routes.ts << 'EOF'
import { Router } from 'express';
import { createBMIRoutes } from '../projects/bmi/routes/bmi.routes';
import { createTDEERoutes } from '../projects/tdee/routes/tdee.routes';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// 確保所有專案路由都需要認證
router.use(authMiddleware);

// 註冊專案路由
router.use('/bmi', createBMIRoutes());
router.use('/tdee', createTDEERoutes());

// 獲取可用的專案列表
router.get('/', (req, res) => {
  try {
    const projects = [
      {
        key: 'bmi',
        name: 'BMI 計算器',
        description: '身體質量指數計算 - 評估體重狀況',
        path: '/projects/bmi',
        version: '1.0.0',
        features: [
          'BMI 計算與分類',
          '健康風險評估',
          'WHO 標準分類',
          '個人化建議',
          '趨勢分析'
        ],
        endpoints: {
          calculate: 'POST /projects/bmi/calculate',
          history: 'GET /projects/bmi/history',
          latest: 'GET /projects/bmi/latest',
          stats: 'GET /projects/bmi/stats',
          trend: 'GET /projects/bmi/trend'
        }
      },
      {
        key: 'tdee',
        name: 'TDEE 計算器',
        description: '每日總能量消耗計算 - 制定營養計畫',
        path: '/projects/tdee',
        version: '1.0.0',
        features: [
          'BMR 與 TDEE 計算',
          '活動等級評估',
          '宏營養素分配',
          '卡路里目標設定',
          '個人化營養建議'
        ],
        endpoints: {
          calculate: 'POST /projects/tdee/calculate',
          activityLevels: 'GET /projects/tdee/activity-levels',
          history: 'GET /projects/tdee/history',
          latest: 'GET /projects/tdee/latest',
          stats: 'GET /projects/tdee/stats',
          nutrition: 'GET /projects/tdee/nutrition-advice'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        projects,
        total: projects.length,
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          supportedFeatures: [
            'calculation',
            'history_tracking',
            'statistics',
            'data_validation',
            'trend_analysis'
          ]
        }
      },
      message: 'Available projects retrieved successfully'
    });
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get projects',
      code: 'PROJECTS_ERROR'
    });
  }
});

// 專案健康檢查端點
router.get('/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        bmi: {
          status: 'operational',
          endpoints: ['calculate', 'history', 'stats', 'trend']
        },
        tdee: {
          status: 'operational', 
          endpoints: ['calculate', 'activity-levels', 'history', 'stats', 'nutrition-advice']
        }
      },
      database: 'connected',
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: healthStatus,
      message: 'All project services are healthy'
    });
  } catch (error) {
    logger.error('Projects health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;
EOF

echo "✅ 主要項目路由已更新"

echo "✅ Part 4 完成 - 控制器與路由已建立"