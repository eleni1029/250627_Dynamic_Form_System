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
