#!/bin/bash

echo "🚀 開始創建 Dynamic Form System 項目結構..."

# 創建前端目錄結構
echo "📁 創建前端目錄結構..."
mkdir -p frontend/src/components/common
mkdir -p frontend/src/components/forms
mkdir -p frontend/src/views/user/projects
mkdir -p frontend/src/views/admin
mkdir -p frontend/src/stores
mkdir -p frontend/src/router
mkdir -p frontend/src/services
mkdir -p frontend/src/types
mkdir -p frontend/src/utils
mkdir -p frontend/src/styles
mkdir -p frontend/src/config
mkdir -p frontend/public

# 創建前端文件
echo "📄 創建前端文件..."
touch frontend/src/components/common/AppHeader.vue
touch frontend/src/components/common/ProjectSelector.vue
touch frontend/src/components/common/UserAvatar.vue
touch frontend/src/components/common/LoadingSpinner.vue
touch frontend/src/components/forms/BaseForm.vue
touch frontend/src/components/forms/FormField.vue
touch frontend/src/views/user/LoginPage.vue
touch frontend/src/views/user/UserDashboard.vue
touch frontend/src/views/user/projects/BMICalculator.vue
touch frontend/src/views/user/projects/TDEECalculator.vue
touch frontend/src/views/admin/AdminLogin.vue
touch frontend/src/views/admin/UserManagement.vue
touch frontend/src/views/admin/PermissionManagement.vue
touch frontend/src/views/admin/UserActivityLogs.vue
touch frontend/src/stores/auth.ts
touch frontend/src/stores/projects.ts
touch frontend/src/stores/admin.ts
touch frontend/src/router/index.ts
touch frontend/src/router/user.ts
touch frontend/src/router/admin.ts
touch frontend/src/services/api.ts
touch frontend/src/services/auth.ts
touch frontend/src/services/projects.ts
touch frontend/src/services/admin.ts
touch frontend/src/types/auth.ts
touch frontend/src/types/projects.ts
touch frontend/src/types/admin.ts
touch frontend/src/utils/calculations.ts
touch frontend/src/utils/validation.ts
touch frontend/src/utils/constants.ts
touch frontend/src/styles/global.css
touch frontend/src/styles/responsive.css
touch frontend/src/config/projects.ts
touch frontend/src/App.vue
touch frontend/src/main.ts
touch frontend/package.json
touch frontend/vite.config.ts
touch frontend/tsconfig.json
touch frontend/tsconfig.node.json
touch frontend/.env
touch frontend/Dockerfile

# 創建後端目錄結構
echo "📁 創建後端目錄結構..."
mkdir -p backend/src/controllers/projects
mkdir -p backend/src/services/projects
mkdir -p backend/src/models/projects
mkdir -p backend/src/routes
mkdir -p backend/src/middleware
mkdir -p backend/src/config
mkdir -p backend/src/database/migrations
mkdir -p backend/src/database/seeds
mkdir -p backend/src/types
mkdir -p backend/src/utils
mkdir -p backend/uploads

# 創建後端文件
echo "📄 創建後端文件..."
touch backend/src/controllers/auth.controller.ts
touch backend/src/controllers/user.controller.ts
touch backend/src/controllers/admin.controller.ts
touch backend/src/controllers/projects/bmi.controller.ts
touch backend/src/controllers/projects/tdee.controller.ts
touch backend/src/services/auth.service.ts
touch backend/src/services/user.service.ts
touch backend/src/services/admin.service.ts
touch backend/src/services/projects/bmi.service.ts
touch backend/src/services/projects/tdee.service.ts
touch backend/src/models/User.ts
touch backend/src/models/Permission.ts
touch backend/src/models/ActivityLog.ts
touch backend/src/models/projects/BMIRecord.ts
touch backend/src/models/projects/TDEERecord.ts
touch backend/src/routes/auth.routes.ts
touch backend/src/routes/user.routes.ts
touch backend/src/routes/admin.routes.ts
touch backend/src/routes/projects.routes.ts
touch backend/src/middleware/auth.middleware.ts
touch backend/src/middleware/admin.middleware.ts
touch backend/src/middleware/validation.middleware.ts
touch backend/src/config/database.ts
touch backend/src/config/session.ts
touch backend/src/config/projects.ts
touch backend/src/database/connection.ts
touch backend/src/database/init.sql
touch backend/src/types/auth.types.ts
touch backend/src/types/user.types.ts
touch backend/src/types/project.types.ts
touch backend/src/utils/encryption.ts
touch backend/src/utils/validation.ts
touch backend/src/utils/logger.ts
touch backend/src/app.ts
touch backend/package.json
touch backend/tsconfig.json
touch backend/.env
touch backend/Dockerfile

# 創建根目錄文件
echo "📄 創建根目錄配置文件..."
touch docker-compose.yml
touch .gitignore
touch README.md

# 創建 uploads 目錄的 .gitkeep
touch backend/uploads/.gitkeep

# 創建 .gitignore 內容
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# Database
*.db
*.sqlite

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml

# Uploads
backend/uploads/*
!backend/uploads/.gitkeep

# Temporary files
tmp/
temp/
EOF

# 創建基本的 README.md
cat > README.md << 'EOF'
# Dynamic Form System

一個基於 Vue 3 + Node.js + PostgreSQL 的動態表單系統

## 快速開始

1. 安裝 Docker 和 Docker Compose
2. 克隆項目並進入目錄
3. 啟動開發環境：
   ```bash
   docker-compose up -d
   ```
4. 訪問應用：
   - 前端：http://localhost:5173
   - 後端 API：http://localhost:3000

## 技術棧

- **前端**：Vue 3 + TypeScript + Element Plus + Pinia
- **後端**：Node.js + Express + TypeScript
- **資料庫**：PostgreSQL
- **開發環境**：Docker + Docker Compose

## 項目結構

- `/frontend` - Vue 3 前端應用
- `/backend` - Node.js 後端 API
- `/docker-compose.yml` - Docker 開發環境配置

## 開發指南

### 新增專案模組
1. 在 `frontend/src/views/user/projects/` 新增 Vue 組件
2. 在 `backend/src/controllers/projects/` 新增控制器
3. 在 `backend/src/services/projects/` 新增服務邏輯
4. 在 `backend/src/models/projects/` 新增資料模型
5. 更新配置文件以註冊新專案

### 預設帳號
- **管理員**：admin / admin123
- **用戶**：需由管理員創建
EOF

echo ""
echo "🎉 項目結構創建完成！"
echo ""
echo "📁 目錄結構已建立在 Dynamic_Form_System/ 資料夾中"
echo ""
echo "📋 接下來請："
echo "1. 將配置文件內容複製到對應位置"
echo "2. 在 Dynamic_Form_System 目錄執行: docker-compose up -d"
echo "3. 開始開發！"
echo ""
echo "📂 主要目錄："
echo "  └── Dynamic_Form_System/"
echo "      ├── frontend/          (Vue 3 前端)"
echo "      ├── backend/           (Node.js 後端)"
echo "      ├── docker-compose.yml (Docker 配置)"
echo "      └── README.md          (項目說明)"