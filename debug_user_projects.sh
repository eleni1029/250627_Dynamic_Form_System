#!/bin/bash

echo "🔍 調試用戶專案權限問題"
echo "======================"

echo "1. 檢查資料庫中的專案..."
psql postgresql://postgres:postgres123@localhost:5432/dynamic_form_system -c "
SELECT project_key, project_name, is_active FROM projects ORDER BY project_key;
"

echo ""
echo "2. 檢查資料庫中的用戶..."
psql postgresql://postgres:postgres123@localhost:5432/dynamic_form_system -c "
SELECT id, username, name, is_active FROM users WHERE is_active = true ORDER BY username;
"

echo ""
echo "3. 檢查用戶權限表..."
psql postgresql://postgres:postgres123@localhost:5432/dynamic_form_system -c "
SELECT 
    u.username,
    p.project_key,
    p.project_name,
    upp.granted_at
FROM user_project_permissions upp
JOIN users u ON upp.user_id = u.id
JOIN projects p ON upp.project_id = p.id
WHERE u.is_active = true
ORDER BY u.username, p.project_key;
"

echo ""
echo "4. 測試用戶登錄並獲取專案..."

# 先登錄
echo "🔐 登錄測試用戶..."
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}')

echo "登錄響應: $LOGIN_RESPONSE"

# 檢查登錄是否成功
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 登錄成功"
    
    echo ""
    echo "📋 獲取用戶專案..."
    PROJECT_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost:3000/api/user/projects)
    echo "專案響應: $PROJECT_RESPONSE"
    
    echo ""
    echo "👤 獲取用戶資料..."
    PROFILE_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost:3000/api/user/profile)
    echo "資料響應: $PROFILE_RESPONSE"
else
    echo "❌ 登錄失敗"
    echo "嘗試其他密碼..."
    
    # 嘗試空密碼
    LOGIN_RESPONSE2=$(curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"testuser","password":""}')
    
    echo "空密碼登錄響應: $LOGIN_RESPONSE2"
fi

# 清理
rm -f /tmp/cookies.txt

echo ""
echo "5. 檢查 UserService.getUserProjects 查詢語句..."
echo "可能的問題："
echo "- 用戶權限表中沒有記錄"
echo "- SQL 查詢有問題"
echo "- 專案鍵值不匹配"