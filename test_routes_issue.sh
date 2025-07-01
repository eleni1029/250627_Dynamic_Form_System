#!/bin/bash

echo "🔍 測試路由問題"
echo "=============="

echo "1. 檢查所有註冊的路由..."
echo "GET /api/debug/routes"
curl -s http://localhost:3000/api/debug/routes | jq .

echo ""
echo "2. 直接測試用戶路由是否存在..."
echo "GET /api/user/profile (未登錄，應該返回 401 而不是 404)"
curl -s http://localhost:3000/api/user/profile

echo ""
echo "3. 登錄並測試用戶路由..."
# 登錄
echo "POST /api/auth/login"
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}')

echo "登錄響應: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "4. 測試已登錄的用戶路由..."
    
    echo "GET /api/user/profile"
    curl -s -b /tmp/cookies.txt http://localhost:3000/api/user/profile
    
    echo ""
    echo "GET /api/user/projects"  
    curl -s -b /tmp/cookies.txt http://localhost:3000/api/user/projects
else
    echo "❌ 登錄失敗，無法測試用戶路由"
fi

# 清理
rm -f /tmp/cookies.txt

echo ""
echo "5. 檢查用戶路由文件是否存在..."
ls -la backend/src/routes/user.routes.ts

echo ""
echo "6. 檢查用戶路由文件內容..."
head -20 backend/src/routes/user.routes.ts