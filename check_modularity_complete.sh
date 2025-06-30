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
