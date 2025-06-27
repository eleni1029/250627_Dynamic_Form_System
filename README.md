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
