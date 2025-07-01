#!/bin/bash

echo "🔍 深度診斷路由問題"
echo "=================="

echo "1. 檢查用戶路由文件..."
if [ -f "backend/src/routes/user.routes.ts" ]; then
    echo "✅ user.routes.ts 存在"
    echo "檢查導出語句..."
    tail -5 backend/src/routes/user.routes.ts
else
    echo "❌ user.routes.ts 不存在"
fi

echo ""
echo "2. 檢查編譯後的文件..."
if [ -f "backend/dist/routes/user.routes.js" ]; then
    echo "✅ 編譯後的 user.routes.js 存在"
    echo "檢查導出..."
    tail -10 backend/dist/routes/user.routes.js
else
    echo "❌ 編譯後的 user.routes.js 不存在，可能編譯有問題"
    echo "嘗試編譯..."
    cd backend && npm run build 2>&1 | head -20
fi

echo ""
echo "3. 檢查動態導入問題..."
node -e "
(async () => {
  try {
    const userRoutes = await import('./backend/src/routes/user.routes.ts');
    console.log('✅ 動態導入成功');
    console.log('Default export:', typeof userRoutes.default);
    console.log('Module keys:', Object.keys(userRoutes));
  } catch (error) {
    console.log('❌ 動態導入失敗:', error.message);
  }
})();
"

echo ""
echo "4. 檢查當前運行的服務器路由..."
echo "調用 /api/debug/routes..."
curl -s http://localhost:3000/api/debug/routes | jq '.routes[]' | grep -E '(user|USER)'

echo ""
echo "5. 檢查 Express Router 是否正確創建..."
node -e "
const express = require('express');
try {
  const userRoutes = require('./backend/src/routes/user.routes.ts').default;
  console.log('✅ require 成功');
  console.log('Router type:', typeof userRoutes);
  console.log('Is function:', typeof userRoutes === 'function');
  console.log('Router stack length:', userRoutes?.stack?.length || 'N/A');
} catch (error) {
  console.log('❌ require 失敗:', error.message);
}
"

echo ""
echo "6. 測試手動路由註冊..."
curl -s -X POST http://localhost:3000/api/test-user-route 2>/dev/null || echo "路由不存在（預期）"

echo ""
echo "7. 檢查 session 設置..."
curl -s -c /tmp/test_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' > /tmp/login_response.json

echo "Session cookies:"
cat /tmp/test_cookies.txt 2>/dev/null || echo "無 cookies"

echo ""
echo "登錄響應:"
cat /tmp/login_response.json

echo ""
echo "8. 使用 session 測試用戶路由..."
curl -s -b /tmp/test_cookies.txt http://localhost:3000/api/user/profile

# 清理
rm -f /tmp/test_cookies.txt /tmp/login_response.json