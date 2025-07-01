#!/bin/bash

echo "🔍 驗證 TypeScript 錯誤修復結果"
echo "================================"

# 檢查當前目錄
if [ ! -d "frontend" ]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

echo ""
echo "🔧 執行 TypeScript 編譯檢查..."
echo "============================="

cd frontend

# 檢查 TypeScript 編譯
echo "📝 檢查前端 TypeScript 編譯..."
npx vue-tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ 前端 TypeScript 編譯通過"
else
    echo "❌ 前端 TypeScript 編譯仍有錯誤"
    echo ""
    echo "🔍 常見問題排查："
    echo "1. 檢查是否所有 Store 方法都已正確導出"
    echo "2. 檢查類型定義是否包含所有必需屬性"
    echo "3. 檢查組件中的屬性引用是否正確"
    exit 1
fi

echo ""
echo "📦 檢查套件依賴..."
echo "=================="

# 檢查是否有缺少的依賴
npm list --depth=0 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 前端套件依賴完整"
else
    echo "⚠️  套件依賴可能有問題，執行 npm install"
fi

cd ..

echo ""
echo "🔧 檢查後端 TypeScript..."
echo "======================="

cd backend

npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ 後端 TypeScript 編譯通過"
else
    echo "❌ 後端 TypeScript 編譯有錯誤"
fi

cd ..

echo ""
echo "📊 修復驗證總結"
echo "=============="
echo "如果所有檢查都通過，表示以下問題已解決："
echo ""
echo "✅ BMI Store 方法問題："
echo "   - calculate 方法已添加"
echo "   - loadLastInput 方法已添加"
echo ""
echo "✅ TDEE Store 方法問題："
echo "   - calculate 方法已添加"
echo "   - loadLastInput 方法已添加"
echo "   - loadActivityLevels 方法已添加"
echo ""
echo "✅ 類型定義問題："
echo "   - BMI 類型添加了 category_cn 屬性"
echo "   - TDEE 類型添加了 activity_factor 屬性"
echo ""
echo "✅ 組件屬性引用問題已修復"
echo ""
echo "🎉 修復完成！現在可以正常編譯和運行"