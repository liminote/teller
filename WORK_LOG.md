# Liminote Daily 開發日誌

## 2026-02-12 (Session 2) - 多人架構準備工作

### 完成事項
- ✅ 建立 `dev` 分支（測試站）並推送到 GitHub
- ✅ 建立 `CLAUDE.md` 工作守則（含部署流程規範）
- ✅ 安裝 `next-auth` 和 `firebase-admin` 套件
- ✅ 建立 TypeScript 型別定義 `src/types/next-auth.d.ts`
- ✅ 建立 `AuthGuard` 元件（登入保護）
- ✅ 建立 `AdminGuard` 元件（管理員權限保護）
- ✅ 建立 `src/lib/firebase.ts`（Firebase Admin SDK 初始化）
- ✅ 建立 `src/lib/auth.ts`（NextAuth 設定骨架）
- ✅ 建立 `src/app/api/auth/[...nextauth]/route.ts`（NextAuth API）
- ✅ 更新 `REFACTOR_ROADMAP.md` 分支名稱 develop → dev
- ✅ Build 驗證通過

### 部署流程（已建立）
- `dev` 分支 = 測試站（Vercel Preview）
- `main` 分支 = 正式站（Vercel Production）
- 所有開發在 dev，測試確認後才 merge 到 main

### 新增檔案
- `CLAUDE.md` - 工作守則
- `src/types/next-auth.d.ts` - NextAuth 型別擴展
- `src/components/AuthGuard.tsx` - 登入保護元件
- `src/components/AdminGuard.tsx` - 管理員保護元件
- `src/lib/firebase.ts` - Firebase 初始化
- `src/lib/auth.ts` - NextAuth 設定
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API

### 下一步（需要使用者操作）
- [ ] 建立 Firebase 專案 → https://console.firebase.google.com
- [ ] 啟用 Firestore、下載服務帳號金鑰
- [ ] 在 Vercel 設定 Firebase 環境變數
- [ ] 建立 Google OAuth 應用程式 → https://console.cloud.google.com
- [ ] 在 Vercel 設定 Google OAuth 環境變數

### 下一步（Claude 可以做）
- [ ] 完成 Phase 2：串接 Google OAuth 登入（需要環境變數先設好）
- [ ] 替換現有密碼登入為 Google 登入

---

## 2026-02-12 (Session 1) - 品牌改名與 Bug 修復

### 完成事項
- ✅ 將 Teller 改名為 Liminote Daily（每日隙音）
- ✅ 更新品牌標語：Listen to the space between / 聆聽時間的隙縫
- ✅ 修復 lunar API bug（移除不存在的 getZhongQi 和 getSolarTerms 方法）
- ✅ 更新以下檔案：
  - `src/app/login/page.tsx` - 登入頁品牌
  - `src/app/layout.tsx` - 頁面標題
  - `package.json` - 專案名稱
  - `README.md` - 專案說明
  - `src/lib/calendar-utils.ts` - Bug 修復

### Git Commits
- `f659586` - Rebrand: Teller → Liminote Daily (每日隙音)
- `c2bd711` - Fix: remove non-existent lunar API methods causing TypeError

### 遇到的問題與解決
1. **問題**：頁面白屏
   - **原因**：lunar.getZhongQi() 方法不存在
   - **解決**：移除該方法調用，簡化節氣處理邏輯

2. **問題**：solar.getYear().getSolarTerms() 錯誤
   - **原因**：API 方法不存在
   - **解決**：移除節氣時間計算功能

---

## 重要資訊

### 重要檔案路徑
- 工作守則：`CLAUDE.md`
- 重構計畫：`REFACTOR_ROADMAP.md`
- 專案位置：`/Users/vannyma/antigravity/01_Personal_OS/Teller`
- 正式站：https://teller-orpin.vercel.app

### 快速恢復
告訴新的 Claude：「請讀取 WORK_LOG.md 和 CLAUDE.md，我們要繼續 Liminote Daily 的開發」

---

## 待辦事項（優先順序）

### 高優先
- [ ] 使用者操作：建立 Firebase 專案 + Google OAuth
- [ ] Phase 2：完成 Google OAuth 登入

### 中優先
- [ ] 在首頁加上品牌名稱
- [ ] 設計 Logo

### 低優先
- [ ] 優化登入頁動畫
- [ ] 調整色彩方案
