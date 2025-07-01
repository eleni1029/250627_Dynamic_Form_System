#!/bin/bash

echo "🔧 初始化資料庫"
echo "=============="

# 檢查 PostgreSQL 是否運行
if ! nc -z localhost 5432 2>/dev/null; then
    echo "❌ PostgreSQL 未運行在 localhost:5432"
    echo "請確保 PostgreSQL 正在運行或使用 Docker:"
    echo "docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL 連接正常"

# 運行資料庫初始化
npm run init-db

echo "🎉 資料庫初始化完成"
