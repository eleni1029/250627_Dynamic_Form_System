#!/bin/bash

echo "🔧 模組化修復 Part 5 - 前端模組與檢查工具"
echo "=========================================="

# ===== 前端 HTTP 客戶端 =====
echo "📝 創建前端 HTTP 客戶端..."

cat > frontend/src/shared/utils/http.ts << 'EOF'
import type { ApiResponse } from '../types/common';

class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    this.timeout = 10000; // 10 秒超時
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 重要：包含 cookies 用於 session
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        console.error(`HTTP request failed: ${endpoint}`, error);
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 上傳文件的專用方法
  async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // 讓瀏覽器自動設置 multipart/form-data 邊界
    });
  }

  // 健康檢查
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // 設置基礎 URL
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  // 設置超時時間
  setTimeout(ms: number): void {
    this.timeout = ms;
  }
}

export const httpClient = new HttpClient();

// 導出類型以供其他模組使用
export type { ApiResponse };
EOF

echo "✅ 前端 HTTP 客戶端已創建"

# ===== 前端共享類型 =====
echo "📝 檢查前端共享類型..."

if [ ! -f "frontend/src/shared/types/common.ts" ]; then
cat > frontend/src/shared/types/common.ts << 'EOF'
// ===== frontend/src/shared/types/common.ts =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  key: string;
  name: string;
  description: string;
  path: string;
  version?: string;
  features?: string[];
  endpoints?: Record<string, string>;
}

export interface UserProjectPermission {
  user_id: string;
  project_id: string;
  project: Project;
  granted_at?: string;
}

// 分頁相關類型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 錯誤處理類型
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: ValidationError[] | any;
  timestamp?: string;
}

// 統計相關類型
export interface Trend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  change: number;
  timeframe: string;
}

export interface BaseStatistics {
  totalRecords: number;
  lastCalculated: string | null;
  trend: Trend;
}

// 表單狀態類型
export interface FormState {
  isLoading: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// 通用的選項類型
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

// 本地化類型
export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

// 主題配置類型
export interface ThemeConfig {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// 通用工具類型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}
EOF

echo "✅ 前端共享類型已創建"
fi

# ===== 更新前端 BMI API =====
echo "📝 更新前端 BMI API..."

cat > frontend/src/projects/bmi/api/index.ts << 'EOF'
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse, PaginationParams } from '../../../shared/types/common';
import type { BMIInput, BMIResult, BMIRecord, BMIStatistics } from '../types';

export const bmiApi = {
  // 計算 BMI
  async calculate(data: BMIInput): Promise<ApiResponse<{
    calculation: BMIResult;
    input: BMIInput;
    record: { id: string; created_at: string };
  }>> {
    return await httpClient.post('/projects/bmi/calculate', data);
  },

  // 獲取最新記錄
  async getLatest(): Promise<ApiResponse<BMIRecord | null>> {
    return await httpClient.get('/projects/bmi/latest');
  },

  // 獲取歷史記錄
  async getHistory(params?: PaginationParams & { 
    startDate?: string; 
    endDate?: string; 
  }): Promise<ApiResponse<{
    records: BMIRecord[];
    total: number;
    limit: number;
  }>> {
    return await httpClient.get('/projects/bmi/history', params);
  },

  // 獲取統計數據
  async getStats(): Promise<ApiResponse<BMIStatistics>> {
    return await httpClient.get('/projects/bmi/stats');
  },

  // 獲取趨勢分析
  async getTrend(days: number = 30): Promise<ApiResponse<{
    trend: string;
    records: BMIRecord[];
    summary: any;
  }>> {
    return await httpClient.get('/projects/bmi/trend', { days });
  },

  // 驗證數據
  async validateData(data: BMIInput): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    input: BMIInput;
  }>> {
    return await httpClient.post('/projects/bmi/validate', data);
  },

  // 刪除記錄
  async deleteRecord(recordId: string): Promise<ApiResponse<{
    deletedRecordId: string;
  }>> {
    return await httpClient.delete(`/projects/bmi/records/${recordId}`);
  },

  // 清空歷史
  async clearHistory(): Promise<ApiResponse<{
    deletedCount: number;
    userId: string;
  }>> {
    return await httpClient.delete('/projects/bmi/history');
  }
};
EOF

echo "✅ 前端 BMI API 已更新"

# ===== 更新前端 TDEE API =====
echo "📝 更新前端 TDEE API..."

cat > frontend/src/projects/tdee/api/index.ts << 'EOF'
import { httpClient } from '../../../shared/utils/http';
import type { ApiResponse, PaginationParams } from '../../../shared/types/common';
import type { TDEEInput, TDEEResult, TDEERecord, ActivityLevel, TDEEStatistics } from '../types';

export const tdeeApi = {
  // 計算 TDEE
  async calculate(data: TDEEInput): Promise<ApiResponse<{
    calculation: TDEEResult;
    input: TDEEInput;
    record: { id: string; created_at: string };
  }>> {
    return await httpClient.post('/projects/tdee/calculate', data);
  },

  // 獲取活動等級
  async getActivityLevels(): Promise<ApiResponse<ActivityLevel[]>> {
    return await httpClient.get('/projects/tdee/activity-levels');
  },

  // 獲取最新記錄
  async getLatest(): Promise<ApiResponse<TDEERecord | null>> {
    return await httpClient.get('/projects/tdee/latest');
  },

  // 獲取歷史記錄
  async getHistory(params?: PaginationParams & { 
    startDate?: string; 
    endDate?: string; 
  }): Promise<ApiResponse<{
    records: TDEERecord[];
    total: number;
    limit: number;
  }>> {
    return await httpClient.get('/projects/tdee/history', params);
  },

  // 獲取統計數據
  async getStats(): Promise<ApiResponse<TDEEStatistics>> {
    return await httpClient.get('/projects/tdee/stats');
  },

  // 獲取營養建議
  async getNutritionAdvice(): Promise<ApiResponse<{
    macronutrients: any;
    calorieGoals: any;
    nutritionAdvice: string[];
    recommendations: any;
    basedOn: any;
  }>> {
    return await httpClient.get('/projects/tdee/nutrition-advice');
  },

  // 驗證數據
  async validateData(data: TDEEInput): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    input: TDEEInput;
  }>> {
    return await httpClient.post('/projects/tdee/validate', data);
  },

  // 驗證活動等級
  async validateActivityLevel(activityLevel: string): Promise<ApiResponse<{
    valid: boolean;
    activityLevel: string;
  }>> {
    return await httpClient.post('/projects/tdee/validate-activity', { 
      activity_level: activityLevel 
    });
  },

  // 刪除記錄
  async deleteRecord(recordId: string): Promise<ApiResponse<{
    deletedRecordId: string;
  }>> {
    return await httpClient.delete(`/projects/tdee/records/${recordId}`);
  },

  // 清空歷史
  async clearHistory(): Promise<ApiResponse<{
    deletedCount: number;
    userId: string;
  }>> {
    return await httpClient.delete('/projects/tdee/history');
  }
};
EOF

echo "✅ 前端 TDEE API 已更新"

# ===== 創建模組化檢查工具 =====
echo "📝 創建模組化檢查工具..."

cat > check_modularity_complete.sh << 'EOF'
#!/bin/bash

echo "🔍 完整專案模組化結構檢查"
echo "================================"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查結果計數
total_checks=0
passed_checks=0
failed_checks=0
warnings=0

# 函數：檢查結果輸出
check_result() {
    local status=$1
    local message=$2
    local details=$3
    
    total_checks=$((total_checks + 1))
    
    case $status in
        "pass")
            echo -e "${GREEN}✅${NC} $message"
            passed_checks=$((passed_checks + 1))
            ;;
        "fail")
            echo -e "${RED}❌${NC} $message"
            if [ -n "$details" ]; then
                echo -e "   ${RED}詳情: $details${NC}"
            fi
            failed_checks=$((failed_checks + 1))
            ;;
        "warn")
            echo -e "${YELLOW}⚠️${NC}  $message"
            if [ -n "$details" ]; then
                echo -e "   ${YELLOW}詳情: $details${NC}"
            fi
            warnings=$((warnings + 1))
            ;;
    esac
}

# 1. 檢查後端目錄結構
echo -e "\n${BLUE}📊 後端目錄結構檢查${NC}"
echo "------------------------"

backend_dirs=(
    "backend/src/projects/bmi/controllers"
    "backend/src/projects/bmi/services"
    "backend/src/projects/bmi/models"
    "backend/src/projects/bmi/types"
    "backend/src/projects/bmi/middleware"
    "backend/src/projects/bmi/routes"
    "backend/src/projects/tdee/controllers"
    "backend/src/projects/tdee/services"
    "backend/src/projects/tdee/models"
    "backend/src/projects/tdee/types"
    "backend/src/projects/tdee/middleware"
    "backend/src/projects/tdee/routes"
    "backend/src/middleware"
    "backend/src/types"
    "backend/src/config"
    "backend/src/utils"
)

for dir in "${backend_dirs[@]}"; do
    if [ -d "$dir" ]; then
        check_result "pass" "目錄存在: $dir"
    else
        check_result "fail" "目錄缺失: $dir"
    fi
done

# 2. 檢查核心後端文件
echo -e "\n${BLUE}📄 核心後端文件檢查${NC}"
echo "------------------------"

backend_files=(
    "backend/src/projects/bmi/controllers/BMIController.ts"
    "backend/src/projects/bmi/services/BMIService.ts"
    "backend/src/projects/bmi/models/BMIRecord.ts"
    "backend/src/projects/bmi/types/bmi.types.ts"
    "backend/src/projects/bmi/middleware/bmi.validation.ts"
    "backend/src/projects/bmi/routes/bmi.routes.ts"
    "backend/src/projects/tdee/controllers/TDEEController.ts"
    "backend/src/projects/tdee/services/TDEEService.ts"
    "backend/src/projects/tdee/models/TDEERecord.ts"
    "backend/src/projects/tdee/types/tdee.types.ts"
    "backend/src/projects/tdee/middleware/tdee.validation.ts"
    "backend/src/projects/tdee/routes/tdee.routes.ts"
    "backend/src/middleware/validation.middleware.ts"
    "backend/src/config/database.ts"
)

for file in "${backend_files[@]}"; do
    if [ -f "$file" ]; then
        check_result "pass" "文件存在: $file"
    else
        check_result "fail" "文件缺失: $file"
    fi
done

# 3. 檢查前端目錄結構
echo -e "\n${BLUE}📊 前端目錄結構檢查${NC}"
echo "------------------------"

frontend_dirs=(
    "frontend/src/projects/bmi/components"
    "frontend/src/projects/bmi/stores"
    "frontend/src/projects/bmi/api"
    "frontend/src/projects/bmi/types"
    "frontend/src/projects/tdee/components"
    "frontend/src/projects/tdee/stores"
    "frontend/src/projects/tdee/api"
    "frontend/src/projects/tdee/types"
    "frontend/src/shared/components"
    "frontend/src/shared/stores"
    "frontend/src/shared/utils"
    "frontend/src/shared/types"
)

for dir in "${frontend_dirs[@]}"; do
    if [ -d "$dir" ]; then
        check_result "pass" "目錄存在: $dir"
    else
        check_result "fail" "目錄缺失: $dir"
    fi
done

# 4. 檢查核心前端文件
echo -e "\n${BLUE}📄 核心前端文件檢查${NC}"
echo "------------------------"

frontend_files=(
    "frontend/src/shared/utils/http.ts"
    "frontend/src/shared/types/common.ts"
    "frontend/src/projects/bmi/api/index.ts"
    "frontend/src/projects/tdee/api/index.ts"
)

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        check_result "pass" "文件存在: $file"
    else
        check_result "fail" "文件缺失: $file"
    fi
done

# 5. 檢查文件大小（500行限制）
echo -e "\n${BLUE}📏 文件大小檢查（500行限制）${NC}"
echo "--------------------------------"

large_files=()

# 檢查後端文件
find backend/src -name "*.ts" -type f | while read file; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ "$lines" -gt 500 ]; then
            check_result "warn" "文件過大: $file ($lines 行)"
        fi
    fi
done

# 檢查前端文件
find frontend/src -name "*.vue" -o -name "*.ts" -type f | while read file; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ "$lines" -gt 500 ]; then
            check_result "warn" "文件過大: $file ($lines 行)"
        fi
    fi
done

# 6. 檢查模組獨立性
echo -e "\n${BLUE}🔗 模組獨立性檢查${NC}"
echo "--------------------"

# 檢查 BMI 模組是否依賴 TDEE
if find backend/src/projects/bmi frontend/src/projects/bmi -name "*.ts" -o -name "*.vue" 2>/dev/null | xargs grep -l "tdee\|TDEE" 2>/dev/null | grep -v ".git" > /dev/null; then
    check_result "warn" "BMI 模組可能存在對 TDEE 模組的依賴"
else
    check_result "pass" "BMI 模組獨立性良好"
fi

# 檢查 TDEE 模組是否依賴 BMI
if find backend/src/projects/tdee frontend/src/projects/tdee -name "*.ts" -o -name "*.vue" 2>/dev/null | xargs grep -l "bmi\|BMI" 2>/dev/null | grep -v ".git" > /dev/null; then
    check_result "warn" "TDEE 模組可能存在對 BMI 模組的依賴"
else
    check_result "pass" "TDEE 模組獨立性良好"
fi

# 7. 檢查 TypeScript 編譯
echo -e "\n${BLUE}🔧 TypeScript 編譯檢查${NC}"
echo "---------------------------"

if [ -f "backend/tsconfig.json" ]; then
    if cd backend && npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        check_result "pass" "後端 TypeScript 編譯通過"
    else
        check_result "fail" "後端 TypeScript 編譯失敗"
    fi
    cd ..
else
    check_result "warn" "後端 tsconfig.json 不存在"
fi

if [ -f "frontend/tsconfig.json" ]; then
    if cd frontend && npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        check_result "pass" "前端 TypeScript 編譯通過"
    else
        check_result "fail" "前端 TypeScript 編譯失敗"
    fi
    cd ..
else
    check_result "warn" "前端 tsconfig.json 不存在"
fi

# 8. 檢查套件依賴
echo -e "\n${BLUE}📦 套件依賴檢查${NC}"
echo "-------------------"

if [ -f "backend/package.json" ] && [ -d "backend/node_modules" ]; then
    check_result "pass" "後端依賴已安裝"
else
    check_result "fail" "後端依賴未安裝"
fi

if [ -f "frontend/package.json" ] && [ -d "frontend/node_modules" ]; then
    check_result "pass" "前端依賴已安裝"
else
    check_result "fail" "前端依賴未安裝"
fi

# 輸出總結
echo -e "\n${BLUE}📊 檢查總結${NC}"
echo "=============="
echo -e "總檢查項目: ${BLUE}$total_checks${NC}"
echo -e "通過: ${GREEN}$passed_checks${NC}"
echo -e "失敗: ${RED}$failed_checks${NC}" 
echo -e "警告: ${YELLOW}$warnings${NC}"

# 計算成功率
if [ $total_checks -gt 0 ]; then
    success_rate=$(( (passed_checks * 100) / total_checks ))
    echo -e "成功率: ${BLUE}${success_rate}%${NC}"
    
    if [ $success_rate -ge 90 ]; then
        echo -e "\n${GREEN}🎉 模組化結構優秀！${NC}"
    elif [ $success_rate -ge 75 ]; then
        echo -e "\n${YELLOW}⚠️  模組化結構良好，但仍有改進空間${NC}"
    else
        echo -e "\n${RED}❌ 模組化結構需要重大改善${NC}"
    fi
fi

echo -e "\n檢查完成！"
EOF

chmod +x check_modularity_complete.sh

echo "✅ 模組化檢查工具已創建"

# ===== 創建啟動腳本 =====
echo "📝 創建啟動腳本..."

cat > start_development.sh << 'EOF'
#!/bin/bash

echo "🚀 啟動 Dynamic Form System 開發環境"
echo "====================================="

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝，請先安裝 npm"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# 安裝後端依賴
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安裝後端依賴..."
    cd backend && npm install
    cd ..
fi

# 安裝前端依賴  
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安裝前端依賴..."
    cd frontend && npm install
    cd ..
fi

# 檢查 PostgreSQL
echo "🔍 檢查資料庫連接..."
if command -v psql &> /dev/null; then
    if psql "postgresql://postgres:postgres123@localhost:5432/dynamic_form_system" -c "SELECT 1;" &> /dev/null; then
        echo "✅ 資料庫連接成功"
    else
        echo "⚠️  資料庫連接失敗，請檢查 PostgreSQL 服務"
        echo "   請確保 PostgreSQL 服務已啟動並且資料庫 'dynamic_form_system' 存在"
    fi
else
    echo "⚠️  未找到 psql 命令，請確保 PostgreSQL 已安裝"
fi

# 運行模組化檢查
echo "🔍 運行模組化檢查..."
if [ -f "check_modularity_complete.sh" ]; then
    bash check_modularity_complete.sh
else
    echo "⚠️  模組化檢查腳本不存在"
fi

echo ""
echo "🎯 啟動指南："
echo "   1. 後端啟動: cd backend && npm run dev"
echo "   2. 前端啟動: cd frontend && npm run dev" 
echo "   3. 訪問應用: http://localhost:5173"
echo "   4. API 文檔: http://localhost:3000/api/projects"
echo ""
echo "🧪 測試命令："
echo "   # 測試後端健康檢查"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "   # 測試專案 API"
echo "   curl http://localhost:3000/api/projects"
echo ""
echo "開發環境準備完成！"
EOF

chmod +x start_development.sh

echo "✅ 啟動腳本已創建"

# ===== 創建模組化文檔 =====
echo "📝 創建模組化開發文檔..."

cat > MODULARITY_GUIDE.md << 'EOF'
# Dynamic Form System 模組化開發指南

## 📁 專案結構概覽

```
Dynamic_Form_System/
├── backend/src/
│   ├── projects/              # 專案模組
│   │   ├── bmi/              # BMI 計算器模組
│   │   │   ├── controllers/  # 控制器層
│   │   │   ├── services/     # 業務邏輯層
│   │   │   ├── models/       # 數據模型層
│   │   │   ├── types/        # 類型定義
│   │   │   ├── middleware/   # 專案專用中間件
│   │   │   └── routes/       # 路由定義
│   │   └── tdee/             # TDEE 計算器模組
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── models/
│   │       ├── types/
│   │       ├── middleware/
│   │       └── routes/
│   ├── middleware/           # 共享中間件
│   ├── types/               # 共享類型定義
│   ├── config/              # 配置文件
│   └── utils/               # 工具函數
└── frontend/src/
    ├── projects/            # 專案模組
    │   ├── bmi/            # BMI 前端模組
    │   │   ├── components/ # Vue 組件
    │   │   ├── stores/     # Pinia 狀態管理
    │   │   ├── api/        # API 接口
    │   │   ├── types/      # 類型定義
    │   │   └── views/      # 頁面組件
    │   └── tdee/           # TDEE 前端模組
    │       ├── components/
    │       ├── stores/
    │       ├── api/
    │       ├── types/
    │       └── views/
    └── shared/             # 共享模組
        ├── components/     # 共享組件
        ├── stores/         # 共享狀態
        ├── utils/          # 工具函數
        └── types/          # 共享類型
```

## 🎯 模組化原則

### 1. 獨立性原則
- ✅ 每個專案模組必須完全獨立
- ✅ 不允許專案間直接依賴
- ✅ 共享功能必須提取到 `shared` 模組

### 2. 文件大小控制
- ✅ 單文件不超過 500 行代碼
- ✅ 超過 500 行需要拆分為多個文件
- ✅ 優先按功能職責拆分

### 3. 命名規範
- ✅ 資料夾使用小寫字母和連字符
- ✅ 文件使用 PascalCase (組件) 或 camelCase (工具)
- ✅ 接口和類型使用 PascalCase

### 4. 導入規範
- ✅ 使用相對路徑導入同模組內容
- ✅ 使用別名導入 shared 模組內容
- ✅ 禁止跨專案模組導入

## 🔧 開發工作流程

### 新增專案模組

1. **創建目錄結構**
```bash
# 後端
mkdir -p backend/src/projects/{project_name}/{controllers,services,models,types,middleware,routes}

# 前端  
mkdir -p frontend/src/projects/{project_name}/{components,stores,api,types,views}
```

2. **實現核心文件**
- `Service`: 業務邏輯實現
- `Model`: 數據模型和資料庫操作
- `Controller`: HTTP 請求處理
- `Types`: TypeScript 類型定義
- `Routes`: 路由配置

3. **註冊模組**
- 在 `backend/src/routes/projects.routes.ts` 註冊路由
- 在前端路由配置中添加專案路由
- 更新資料庫配置和權限

### 代碼質量檢查

```bash
# 運行完整模組化檢查
bash check_modularity_complete.sh

# 檢查 TypeScript 編譯
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# 檢查文件大小
find . -name "*.ts" -o -name "*.vue" | xargs wc -l | awk '$1 > 500'
```

## 📊 模組化檢查清單

### 開發階段
- [ ] 專案模組結構完整
- [ ] 文件大小控制在500行以內
- [ ] 無跨專案依賴
- [ ] 類型定義完整
- [ ] API接口規範

### 測試階段  
- [ ] 模組獨立性測試
- [ ] API功能測試
- [ ] 前端組件測試
- [ ] TypeScript 編譯通過

### 部署階段
- [ ] 資料庫遷移完成
- [ ] 配置文件更新
- [ ] 文檔更新完整
- [ ] 生產環境測試通過

## 🚀 常用命令

```bash
# 啟動開發環境
bash start_development.sh

# 模組化檢查
bash check_modularity_complete.sh

# 後端開發
cd backend && npm run dev

# 前端開發
cd frontend && npm run dev

# 測試 API
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/projects/bmi/calculate -X POST -H "Content-Type: application/json" -d '{"height":175,"weight":70}'
```

## 📝 最佳實踐

1. **始終遵循模組化原則**
2. **定期運行模組化檢查**
3. **保持文件大小在合理範圍內**
4. **使用 TypeScript 確保類型安全**
5. **編寫清晰的 API 文檔**
6. **建立完整的測試覆蓋**

## 🔗 相關資源

- [TypeScript 最佳實踐](https://typescript-eslint.io/docs/)
- [Vue 3 組件設計](https://vuejs.org/guide/reusability/composables.html)
- [Express.js 模組化](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL 設計模式](https://www.postgresql.org/docs/current/)
EOF

echo "✅ 模組化開發文檔已創建"

echo ""
echo "✅ Part 5 完成 - 前端模組與檢查工具已建立"
echo ""
echo "🎉 所有模組化修復完成！"
echo "========================"
echo ""
echo "📋 執行步驟："
echo "   1. bash check_modularity_complete.sh  # 檢查模組化結構"
echo "   2. bash start_development.sh          # 啟動開發環境" 
echo "   3. 閱讀 MODULARITY_GUIDE.md          # 查看開發指南"
echo ""
echo "🔧 修復內容總結："
echo "   ✅ Services 層 (BMI & TDEE)"
echo "   ✅ Models 層 (數據模型)"
echo "   ✅ 類型定義 (完整的 TypeScript 支持)"
echo "   ✅ 驗證中間件 (多層驗證)"
echo "   ✅ 控制器 (RESTful API)"
echo "   ✅ 路由系統 (模組化路由)"
echo "   ✅ 前端 API 客戶端"
echo "   ✅ 模組化檢查工具"
echo "   ✅ 開發指南文檔"