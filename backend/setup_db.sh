#!/bin/bash
# backend/setup_db.sh - 資料庫設置腳本

echo "🚀 Setting up PostgreSQL database for Dynamic Form System..."

# 檢查 PostgreSQL 是否安裝
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   brew install postgresql"
    exit 1
fi

# 檢查 PostgreSQL 是否運行
if ! brew services list | grep postgresql | grep started &> /dev/null; then
    echo "🔄 Starting PostgreSQL service..."
    brew services start postgresql
    sleep 3
fi

# 獲取當前用戶名
CURRENT_USER=$(whoami)
echo "👤 Current user: $CURRENT_USER"

# 嘗試連接並設置資料庫
echo "🔧 Setting up database..."

# 方案 1：使用當前用戶創建資料庫
psql postgres -c "CREATE DATABASE dynamic_form_system;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database created successfully using user: $CURRENT_USER"
    echo "📝 Please use these settings in your .env file:"
    echo "DATABASE_USER=$CURRENT_USER"
    echo "DATABASE_PASSWORD="
    echo "DATABASE_NAME=dynamic_form_system"
    exit 0
fi

# 方案 2：創建 postgres 用戶
echo "🔄 Attempting to create postgres user..."
psql postgres -c "CREATE USER postgres WITH PASSWORD 'postgres123';" 2>/dev/null
psql postgres -c "ALTER USER postgres CREATEDB;" 2>/dev/null
psql postgres -c "CREATE DATABASE dynamic_form_system OWNER postgres;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database and postgres user created successfully"
    echo "📝 Please use these settings in your .env file:"
    echo "DATABASE_USER=postgres"
    echo "DATABASE_PASSWORD=postgres123"
    echo "DATABASE_NAME=dynamic_form_system"
    exit 0
fi

# 方案 3：手動指導
echo "⚠️  Automatic setup failed. Please manually set up the database:"
echo ""
echo "1. Connect to PostgreSQL:"
echo "   psql postgres"
echo ""
echo "2. Run these commands:"
echo "   CREATE USER postgres WITH PASSWORD 'postgres123';"
echo "   ALTER USER postgres CREATEDB;"
echo "   CREATE DATABASE dynamic_form_system OWNER postgres;"
echo "   \\q"
echo ""
echo "3. Then update your .env file with:"
echo "   DATABASE_USER=postgres"
echo "   DATABASE_PASSWORD=postgres123"
echo "   DATABASE_NAME=dynamic_form_system"