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
