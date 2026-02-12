# Liminote Daily（每日隙音）多人架構重構實作文件

**專案目標**：將 Liminote Daily 從單人使用改造為多人 SaaS 平台

**實作日期**：2025-02-12 開始
**負責人**：vannyma
**協作 AI**：Claude Code (Opus 4.6)

---

## 📊 現況與目標

### 現況（單人版）
- ✅ 使用 Google Sheets API 儲存資料
- ✅ 密碼登入（固定密碼）
- ✅ 所有資料存在一個 Google Sheet
- ✅ 只有你自己使用

### 目標（多人版）
- 🎯 Google OAuth 登入（每個人用自己的 Google 帳號）
- 🎯 每個使用者有自己的 Google Sheet
- 🎯 Firebase Firestore 儲存使用者對應關係
- 🎯 訂閱管理（付費/免費/Admin）
- 🎯 Admin 管理介面
- 🎯 初次設定流程（Onboarding）
- 🎯 測試站/正式站分離

---

## 🗺️ 架構圖

### 目前架構
```
使用者
  ↓ 密碼登入
Next.js App
  ↓
單一 Google Sheet（你的個人命盤）
```

### 目標架構
```
使用者
  ↓ Google OAuth
Next.js App (Vercel)
  ↓
  ├─→ Firebase Firestore
  │   └─ 儲存：userId → sheetId 對應
  │   └─ 儲存：訂閱狀態、帳號類型
  │
  └─→ Google Sheets API
      ├─ User A's Sheet
      ├─ User B's Sheet
      └─ User C's Sheet
```

---

## 🏗️ 實作步驟總覽

```
Phase 1：環境準備與 Git 分支設定（1 天）
  ├─ 建立 dev 分支
  ├─ 設定 Vercel 雙環境部署
  └─ 建立 Firebase 專案

Phase 2：Google OAuth 登入（2 天）
  ├─ 安裝 NextAuth.js
  ├─ 設定 Google OAuth
  └─ 替換現有密碼登入

Phase 3：Firestore 整合（2 天）
  ├─ 建立資料結構
  ├─ 實作使用者註冊流程
  └─ Sheet 範本複製機制

Phase 4：多使用者資料隔離（2 天）
  ├─ 修改所有 API 讀取「當前使用者」的 Sheet
  ├─ 移除寫死的 GOOGLE_SHEETS_ID
  └─ 測試多帳號隔離

Phase 5：設定頁面（Onboarding）（3 天）
  ├─ 建立 /settings 頁面
  ├─ 八字輸入介面
  ├─ 紫微貼上解析
  └─ 寫入使用者 Sheet

Phase 6：訂閱管理（2 天）
  ├─ Firestore 訂閱資料結構
  ├─ 權限檢查中介層
  └─ 到期提醒邏輯

Phase 7：Admin 管理介面（3 天）
  ├─ /admin/users 使用者列表
  ├─ /admin/users/[id] 使用者詳情
  ├─ 訂閱管理
  └─ 臨時存取權限

Phase 8：測試與部署（2 天）
  ├─ 多帳號測試
  ├─ 邊界測試
  └─ 正式上線

總計：約 17 天（3 週）
```

---

## 📝 Phase 1：環境準備與 Git 分支設定

### 目標
- 建立 dev 分支（測試站）
- 設定 Vercel 雙環境部署
- 建立 Firebase 專案

### 步驟

#### 1.1 建立 Git 分支

```bash
cd ~/antigravity/01_Personal_OS/Teller

# 確認目前在 main 分支（如果有的話）
git branch

# 如果還沒初始化 main 分支
git branch -M main

# 建立並切換到 dev 分支
git checkout -b dev

# 推送到 GitHub
git push -u origin dev
```

**檢查點**：
- [ ] `git branch` 顯示 `* dev`
- [ ] GitHub 上看到兩個分支：main, dev

---

#### 1.2 設定 Vercel 雙環境部署

**步驟 A：連結 GitHub Repository**

1. 登入 [Vercel](https://vercel.com)
2. 點「Add New Project」
3. 選擇 Teller 專案的 GitHub repo
4. 點「Import」

**步驟 B：設定環境變數**

在 Vercel Project Settings → Environment Variables：

| 變數名稱 | 值 | 環境 |
|---------|---|------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 生成 | All |
| `NEXTAUTH_URL` | `https://你的網域.com` | Production |
| `NEXTAUTH_URL` | `https://teller-dev.vercel.app` | Preview (dev) |
| `GOOGLE_CLIENT_ID` | (稍後設定) | All |
| `GOOGLE_CLIENT_SECRET` | (稍後設定) | All |
| `FIREBASE_PROJECT_ID` | (稍後設定) | All |
| `FIREBASE_PRIVATE_KEY` | (稍後設定) | All |
| `FIREBASE_CLIENT_EMAIL` | (稍後設定) | All |

**步驟 C：設定分支部署規則**

在 Vercel Project Settings → Git：

```
Production Branch: main
  → 部署到：teller.你的網域.com

Preview Branches: dev
  → 部署到：teller-dev-xxx.vercel.app
```

**檢查點**：
- [ ] Vercel 顯示兩個環境：Production, Preview
- [ ] 推送 dev 分支會自動部署到 Preview 環境

---

#### 1.3 建立 Firebase 專案

**步驟 A：建立專案**

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 點「新增專案」
3. 專案名稱：`teller-prod`（或你喜歡的名稱）
4. 關閉 Google Analytics（可選）
5. 建立專案

**步驟 B：啟用 Firestore**

1. 左側選單 → Firestore Database
2. 點「建立資料庫」
3. 選擇「以正式版模式啟動」
4. 選擇位置：`asia-east1` (台灣) 或 `asia-northeast1` (日本)

**步驟 C：設定安全規則**

在 Firestore → 規則，替換為：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 使用者只能讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin 可以讀寫所有資料
    match /{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'admin';
    }

    // 訂閱資料：使用者可讀自己的，Admin 可讀寫所有
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'admin');
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'admin';
    }
  }
}
```

**步驟 D：取得服務帳號金鑰**

1. 左側選單 → 專案設定（齒輪圖示）→ 服務帳戶
2. 選擇「Firebase Admin SDK」
3. 點「產生新的私密金鑰」
4. 下載 JSON 檔案（**妥善保管！**）

JSON 檔案內容類似：
```json
{
  "type": "service_account",
  "project_id": "teller-prod",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxx@teller-prod.iam.gserviceaccount.com",
  ...
}
```

**步驟 E：設定環境變數**

回到 Vercel，新增：

| 變數名稱 | 值 | 來源 |
|---------|---|------|
| `FIREBASE_PROJECT_ID` | `teller-prod` | JSON 的 project_id |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxx@...` | JSON 的 client_email |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | JSON 的 private_key（保留 `\n`） |

**檢查點**：
- [ ] Firebase Console 看到 Firestore 已啟用
- [ ] Vercel 環境變數已設定 FIREBASE_*

---

## 📝 Phase 2：Google OAuth 登入

### 目標
- 安裝並設定 NextAuth.js
- 建立 Google OAuth 應用程式
- 替換現有的密碼登入

### 步驟

#### 2.1 安裝 NextAuth.js

```bash
cd ~/antigravity/01_Personal_OS/Teller
npm install next-auth
```

#### 2.2 建立 Google OAuth 應用程式

**步驟 A：前往 Google Cloud Console**

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案（或選擇現有專案）：`Teller Auth`
3. 左側選單 → APIs & Services → OAuth consent screen

**步驟 B：設定 OAuth 同意畫面**

- User Type: 選「External」（外部）
- 應用程式名稱: `Teller`
- 使用者支援電子郵件: 你的 email
- 應用程式首頁: `https://teller.你的網域.com`
- 授權網域: `你的網域.com`, `vercel.app`
- 開發人員聯絡資訊: 你的 email
- 點「儲存並繼續」

**Scopes 設定**（第 2 步）：
- 新增以下 scopes：
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `.../auth/drive.file`（建立/存取 App 建立的檔案）
  - `.../auth/spreadsheets`（讀寫試算表）

**Test users**（第 3 步）：
- 新增你自己的 email（測試期間只有你能登入）
- 新增 2-3 個測試帳號

**步驟 C：建立 OAuth 2.0 用戶端 ID**

1. APIs & Services → Credentials
2. 點「建立憑證」→ OAuth 2.0 用戶端 ID
3. 應用程式類型: 選「網頁應用程式」
4. 名稱: `Teller Web Client`
5. 已授權的重新導向 URI：
   - `https://你的網域.com/api/auth/callback/google`
   - `https://teller-dev.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`（本地測試）
6. 點「建立」

會得到：
- **用戶端 ID**: `123456789-xxxxx.apps.googleusercontent.com`
- **用戶端密碼**: `GOCSPX-xxxxxxxxxxxxx`

**步驟 D：更新 Vercel 環境變數**

| 變數名稱 | 值 |
|---------|---|
| `GOOGLE_CLIENT_ID` | 用戶端 ID |
| `GOOGLE_CLIENT_SECRET` | 用戶端密碼 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 產生 |
| `NEXTAUTH_URL` | Production: `https://你的網域.com` |

**本地測試用** `.env.local`:
```bash
GOOGLE_CLIENT_ID=你的用戶端ID
GOOGLE_CLIENT_SECRET=你的用戶端密碼
NEXTAUTH_SECRET=你的secret
NEXTAUTH_URL=http://localhost:3000
```

**檢查點**：
- [ ] Google Cloud Console 看到 OAuth 應用程式已建立
- [ ] Vercel 環境變數已設定 GOOGLE_CLIENT_*

---

#### 2.3 建立 NextAuth 設定檔

**建立檔案**：`src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './firebase'; // 稍後建立
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // 檢查使用者是否已存在
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // 新使用者：建立基本資料（sheetId 稍後在 onboarding 建立）
          await setDoc(userRef, {
            email: user.email,
            name: user.name || '',
            accountType: 'free', // 預設免費帳號
            createdAt: new Date().toISOString(),
            onboardingCompleted: false,
          });
        }

        // 儲存 access token（用於存取 Google Sheets）
        if (account?.access_token) {
          await setDoc(userRef, {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
          }, { merge: true });
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async session({ session, token }) {
      if (session.user) {
        // 從 Firestore 讀取使用者資料
        const userRef = doc(db, 'users', token.sub!);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          session.user.id = token.sub!;
          session.user.accountType = userData.accountType;
          session.user.sheetId = userData.sheetId;
          session.user.onboardingCompleted = userData.onboardingCompleted;
        }
      }
      return session;
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};
```

---

#### 2.4 建立 Firebase 初始化檔案

**建立檔案**：`src/lib/firebase.ts`

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 初始化 Firebase Admin（server-side）
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const db = getFirestore();
```

**安裝依賴**：
```bash
npm install firebase-admin
```

---

#### 2.5 建立 NextAuth API Route

**建立檔案**：`src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

#### 2.6 更新 TypeScript 型別定義

**建立檔案**：`src/types/next-auth.d.ts`

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      accountType: 'free' | 'paid' | 'admin';
      sheetId?: string;
      onboardingCompleted: boolean;
    };
  }
}
```

---

#### 2.7 替換登入頁面

**修改檔案**：`src/app/login/page.tsx`

```typescript
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      // 已登入，檢查是否完成 onboarding
      if (!session.user.onboardingCompleted) {
        router.push('/settings');
      } else {
        router.push('/');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-slate-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E5E2DB]">
      <div className="max-w-md w-full p-8">
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <h1 className="text-4xl font-black text-slate-800 mb-2 chinese-font">Teller</h1>
          <p className="text-slate-500 mb-12 chinese-font">每日能量指引系統</p>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full bg-slate-800 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 帳號登入
          </button>

          <p className="text-xs text-slate-400 mt-6 chinese-font">
            登入即表示同意服務條款與隱私政策
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

#### 2.8 更新 Root Layout

**修改檔案**：`src/app/layout.tsx`

在 `<body>` 外包一層 `SessionProvider`：

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

**安裝依賴**：
```bash
npm install next-auth
```

---

#### 2.9 保護需要登入的頁面

**建立檔案**：`src/components/AuthGuard.tsx`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return null;
}
```

**使用方式**：在需要登入的頁面包一層

```typescript
// src/app/page.tsx
import AuthGuard from '@/components/AuthGuard';

export default function HomePage() {
  return (
    <AuthGuard>
      {/* 原本的頁面內容 */}
    </AuthGuard>
  );
}
```

---

### 檢查點（Phase 2）

- [ ] `npm install next-auth firebase-admin` 成功
- [ ] `.env.local` 設定完成
- [ ] 本地測試：`npm run dev`
- [ ] 訪問 `http://localhost:3000/login`
- [ ] 點擊「使用 Google 帳號登入」
- [ ] 成功登入並導向首頁
- [ ] Firebase Console → Firestore → users 看到你的資料

---

## 📝 Phase 3：Firestore 整合與 Sheet 複製

### 目標
- 建立範本 Google Sheet
- 新使用者註冊時自動複製範本
- 在 Firestore 儲存 sheetId

### 步驟

#### 3.1 準備範本 Google Sheet

**步驟 A：複製現有 Sheet 作為範本**

1. 開啟你目前的 Google Sheet
2. 檔案 → 建立副本
3. 命名為：`Teller Template - Master Copy`
4. 清空以下工作表的資料（但保留結構）：
   - `每日記錄`（清空所有列，保留標題列）
   - `答題記錄`（清空）
5. 保留以下工作表的資料：
   - `每日基本資料`（2025/2026 曆法資料）
   - `運勢對照`（可以留一些預設範例）
   - `題庫`（可以留一些預設範例）

**步驟 B：設定範本權限**

1. 點右上角「共用」
2. 將權限改為「知道連結的任何人」→「檢視者」
3. 複製 Sheet URL 中的 ID：
   ```
   https://docs.google.com/spreadsheets/d/【這段是 ID】/edit
   ```
4. 將 ID 存為環境變數 `TEMPLATE_SHEET_ID`

**Vercel 環境變數**：
```
TEMPLATE_SHEET_ID = 1abc...xyz
```

---

#### 3.2 建立 Sheet 複製功能

**建立檔案**：`src/lib/google-drive.ts`

```typescript
import { google } from 'googleapis';

/**
 * 複製範本 Sheet 到使用者的 Google Drive
 * @param accessToken - 使用者的 Google OAuth access token
 * @param userName - 使用者名稱（用於命名）
 * @returns 新 Sheet 的 ID
 */
export async function copyTemplateSheet(
  accessToken: string,
  userName: string
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const templateId = process.env.TEMPLATE_SHEET_ID!;

  try {
    // 複製範本
    const response = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `Teller - ${userName}`,
        // 可選：放到特定資料夾
        // parents: ['folder-id'],
      },
    });

    const newSheetId = response.data.id!;
    console.log(`✅ Sheet 複製成功：${newSheetId}`);

    return newSheetId;
  } catch (error) {
    console.error('❌ 複製 Sheet 失敗:', error);
    throw new Error('無法建立您的個人資料表，請稍後再試');
  }
}

/**
 * 授予 Service Account 編輯權限（讓 API 可以寫入）
 */
export async function grantServiceAccountAccess(
  accessToken: string,
  sheetId: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
                               process.env.FIREBASE_CLIENT_EMAIL!;

  try {
    await drive.permissions.create({
      fileId: sheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: serviceAccountEmail,
      },
    });
    console.log(`✅ Service Account 權限已授予`);
  } catch (error) {
    console.error('❌ 授予權限失敗:', error);
    throw new Error('無法設定資料表權限');
  }
}
```

---

#### 3.3 建立 Onboarding API

**建立檔案**：`src/app/api/onboarding/create-sheet/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { copyTemplateSheet, grantServiceAccountAccess } from '@/lib/google-drive';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase-admin/firestore';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const { id: userId, name, email } = session.user;

    // 檢查是否已經有 Sheet
    const userRef = doc(db, 'users', userId);
    const userDoc = await userRef.get();

    if (userDoc.exists() && userDoc.data()?.sheetId) {
      return NextResponse.json({
        error: '您已經有資料表了',
        sheetId: userDoc.data()?.sheetId
      }, { status: 400 });
    }

    // 從 session 取得 access token（需要在 auth callback 儲存）
    const accessToken = userDoc.data()?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: '缺少 Google 存取權限' }, { status: 403 });
    }

    // 1. 複製範本
    const newSheetId = await copyTemplateSheet(accessToken, name || email);

    // 2. 授予 Service Account 權限（讓後端 API 可以讀寫）
    await grantServiceAccountAccess(accessToken, newSheetId);

    // 3. 儲存到 Firestore
    await updateDoc(userRef, {
      sheetId: newSheetId,
      sheetCreatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      sheetId: newSheetId
    });
  } catch (error: any) {
    console.error('建立 Sheet 失敗:', error);
    return NextResponse.json({
      error: error.message || '建立失敗'
    }, { status: 500 });
  }
}
```

---

### 檢查點（Phase 3）

- [ ] 範本 Sheet 已建立並設為「知道連結的任何人可檢視」
- [ ] `TEMPLATE_SHEET_ID` 環境變數已設定
- [ ] 測試 API：`POST /api/onboarding/create-sheet`
- [ ] 成功後，使用者的 Google Drive 出現新 Sheet
- [ ] Firestore 的 users/{userId} 有 sheetId 欄位

---

## 📝 Phase 4：多使用者資料隔離

### 目標
- 修改所有 API 路由，改為讀取「當前使用者」的 Sheet
- 移除寫死的 `GOOGLE_SHEETS_ID`
- 確保使用者只能存取自己的資料

### 步驟

#### 4.1 修改 Google Sheets 工具函式

**修改檔案**：`src/lib/google-sheets.ts`

找到所有使用 `process.env.GOOGLE_SHEETS_ID` 的地方，改為接受 `sheetId` 參數：

```typescript
// ❌ 舊版（寫死）
export async function readSheet(range: string) {
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID, // ❌ 寫死
    range,
  });
  return response.data.values;
}

// ✅ 新版（動態）
export async function readSheet(sheetId: string, range: string) {
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId, // ✅ 動態傳入
    range,
  });
  return response.data.values;
}
```

**需要修改的函式**：
- `readSheet(sheetId, range)`
- `writeSheet(sheetId, range, values)`
- `appendSheet(sheetId, range, values)`
- `updateSheet(sheetId, range, values)`
- `batchUpdate(sheetId, requests)`

---

#### 4.2 建立 Session 工具函式

**建立檔案**：`src/lib/session-utils.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

/**
 * 取得當前登入使用者的 sheetId
 * 如果未登入或沒有 sheetId，返回錯誤回應
 */
export async function getAuthenticatedUserSheetId(): Promise<
  { sheetId: string; userId: string } | NextResponse
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { sheetId, id: userId } = session.user;

  if (!sheetId) {
    return NextResponse.json({
      error: '請先完成初次設定',
      needsOnboarding: true
    }, { status: 403 });
  }

  return { sheetId, userId };
}

/**
 * 檢查是否為 Admin
 */
export async function requireAdmin(): Promise<true | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  if (session.user.accountType !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  return true;
}

/**
 * 檢查訂閱是否有效
 */
export async function checkSubscription(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists()) return false;

  const userData = userDoc.data();

  // Admin 永遠有效
  if (userData.accountType === 'admin') return true;

  // 免費帳號有限制（例如只能用 7 天）
  if (userData.accountType === 'free') {
    const createdAt = new Date(userData.createdAt);
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 7;
  }

  // 付費帳號：檢查訂閱到期日
  // （需要查詢 subscriptions collection）
  // 這部分在 Phase 6 實作

  return true;
}
```

---

#### 4.3 修改所有 API 路由

需要修改的 API 路由：
- `src/app/api/records/route.ts`
- `src/app/api/records/save/route.ts`
- `src/app/api/daily-data/route.ts`
- `src/app/api/status-mapping/route.ts`
- `src/app/api/keywords/route.ts`

**範例**：修改 `src/app/api/records/route.ts`

```typescript
// ❌ 舊版
import { readSheet } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await readSheet('每日記錄!A2:Z'); // ❌ 沒指定 sheetId
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
  }
}

// ✅ 新版
import { readSheet } from '@/lib/google-sheets';
import { getAuthenticatedUserSheetId } from '@/lib/session-utils';

export async function GET() {
  try {
    // 1. 取得當前使用者的 sheetId
    const authResult = await getAuthenticatedUserSheetId();
    if (authResult instanceof NextResponse) return authResult; // 未登入

    const { sheetId } = authResult;

    // 2. 讀取該使用者的資料
    const data = await readSheet(sheetId, '每日記錄!A2:Z'); // ✅ 動態 sheetId
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
  }
}
```

**逐一修改所有 API**：

```typescript
// src/app/api/records/save/route.ts
import { getAuthenticatedUserSheetId } from '@/lib/session-utils';
import { appendSheet, updateSheet } from '@/lib/google-sheets';

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUserSheetId();
  if (authResult instanceof NextResponse) return authResult;

  const { sheetId } = authResult;
  const body = await request.json();

  // 使用 sheetId 寫入資料...
}
```

重複這個模式修改所有 API 路由。

---

### 檢查點（Phase 4）

- [ ] 所有 API 路由都改用 `getAuthenticatedUserSheetId()`
- [ ] 移除所有 `process.env.GOOGLE_SHEETS_ID` 的使用
- [ ] 測試：建立 2 個測試帳號
- [ ] 測試：帳號 A 儲存資料，帳號 B 看不到
- [ ] 測試：帳號 B 儲存資料，帳號 A 看不到

---

## 📝 Phase 5：設定頁面（Onboarding）

### 目標
- 建立 `/settings` 頁面
- 八字輸入介面（8 個字）
- 紫微斗數貼上解析
- 儲存到使用者的 Sheet

### 步驟

#### 5.1 建立設定頁面

**建立檔案**：`src/app/settings/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSheet, setHasSheet] = useState(false);

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    bazi: {
      yearStem: '', yearBranch: '',
      monthStem: '', monthBranch: '',
      dayStem: '', dayBranch: '',
      hourStem: '', hourBranch: '',
    },
    ziwei: {
      palacePosition: '', // 本命命宮（子/丑/寅...）
      flowYearPalace: '', // 2025 流年命宮
      rawText: '', // 文墨天機貼上的原始文字
    },
  });

  useEffect(() => {
    // 檢查是否已有 Sheet
    if (session?.user?.sheetId) {
      setHasSheet(true);
      // 可以從 Sheet 讀取現有設定...
    }
  }, [session]);

  const handleCreateSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/create-sheet', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setHasSheet(true);
      alert('✅ 個人資料表已建立！');
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert('✅ 設定已儲存！');
      router.push('/');
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#E5E2DB] py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-black text-slate-800 mb-2 chinese-font">個人設定</h1>
          <p className="text-slate-500 mb-8 chinese-font">請完整填寫以下資料，以獲得準確的能量指引</p>

          {!hasSheet && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-amber-900 mb-2 chinese-font">🎉 歡迎使用 Teller！</h2>
              <p className="text-amber-800 mb-4 chinese-font">首先，我們需要為您建立一個專屬的資料表。</p>
              <button
                onClick={handleCreateSheet}
                disabled={loading}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? '建立中...' : '建立我的專屬資料表'}
              </button>
            </div>
          )}

          {hasSheet && (
            <div className="space-y-8">
              {/* 個人資訊 */}
              <section className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 mb-6 chinese-font">個人資訊</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">姓名</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none"
                      placeholder="請輸入您的姓名"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">出生日期</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">出生時間</label>
                      <input
                        type="time"
                        value={formData.birthTime}
                        onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 八字命盤 */}
              <section className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 mb-2 chinese-font">八字命盤</h2>
                <p className="text-sm text-slate-500 mb-6 chinese-font">
                  💡 請至 <a href="https://www.click108.com.tw/fortunetelling/bazi/fortune.php" target="_blank" className="text-blue-600 underline">元亨利貞網</a> 查詢您的八字
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {['year', 'month', 'day', 'hour'].map((pillar) => {
                    const label = { year: '年柱', month: '月柱', day: '日柱', hour: '時柱' }[pillar];
                    return (
                      <div key={pillar}>
                        <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">{label}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={1}
                            value={formData.bazi[`${pillar}Stem` as keyof typeof formData.bazi]}
                            onChange={(e) => setFormData({
                              ...formData,
                              bazi: { ...formData.bazi, [`${pillar}Stem`]: e.target.value }
                            })}
                            className="w-1/2 px-4 py-3 rounded-xl border-2 border-slate-200 text-center text-2xl font-black chinese-font focus:border-slate-400 outline-none"
                            placeholder="甲"
                          />
                          <input
                            type="text"
                            maxLength={1}
                            value={formData.bazi[`${pillar}Branch` as keyof typeof formData.bazi]}
                            onChange={(e) => setFormData({
                              ...formData,
                              bazi: { ...formData.bazi, [`${pillar}Branch`]: e.target.value }
                            })}
                            className="w-1/2 px-4 py-3 rounded-xl border-2 border-slate-200 text-center text-2xl font-black chinese-font focus:border-slate-400 outline-none"
                            placeholder="子"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 紫微斗數 */}
              <section className="bg-white rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-800 mb-2 chinese-font">紫微斗數</h2>
                <p className="text-sm text-slate-500 mb-6 chinese-font">
                  💡 請至 <a href="https://www.windada.com/fate/ziweidoushu" target="_blank" className="text-blue-600 underline">文墨天機</a> 排盤後複製貼上
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">貼入排盤結果（選填）</label>
                    <textarea
                      value={formData.ziwei.rawText}
                      onChange={(e) => setFormData({
                        ...formData,
                        ziwei: { ...formData.ziwei, rawText: e.target.value }
                      })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none chinese-font"
                      rows={6}
                      placeholder="命宮：子宮，紫微天府&#10;兄弟宮：丑宮，太陽天梁&#10;..."
                    />
                  </div>

                  <div className="text-center text-slate-400 font-bold chinese-font">或</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">本命命宮</label>
                      <select
                        value={formData.ziwei.palacePosition}
                        onChange={(e) => setFormData({
                          ...formData,
                          ziwei: { ...formData.ziwei, palacePosition: e.target.value }
                        })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none chinese-font"
                      >
                        <option value="">請選擇</option>
                        {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(b => (
                          <option key={b} value={b}>{b}宮</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2 chinese-font">2025 流年命宮</label>
                      <select
                        value={formData.ziwei.flowYearPalace}
                        onChange={(e) => setFormData({
                          ...formData,
                          ziwei: { ...formData.ziwei, flowYearPalace: e.target.value }
                        })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 outline-none chinese-font"
                      >
                        <option value="">請選擇</option>
                        {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(b => (
                          <option key={b} value={b}>{b}宮</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* 儲存按鈕 */}
              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-slate-800 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? '儲存中...' : '儲存設定'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
```

---

#### 5.2 建立儲存設定 API

**建立檔案**：`src/app/api/settings/save/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAuthenticatedUserSheetId } from '@/lib/session-utils';
import { updateSheet } from '@/lib/google-sheets';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUserSheetId();
    if (authResult instanceof NextResponse) return authResult;

    const { sheetId, userId } = authResult;
    const body = await request.json();

    // 1. 寫入八字資料到 Sheet
    await updateSheet(sheetId, '命盤資料_八字!A2:H2', [[
      body.bazi.yearStem,
      body.bazi.yearBranch,
      body.bazi.monthStem,
      body.bazi.monthBranch,
      body.bazi.dayStem,
      body.bazi.dayBranch,
      body.bazi.hourStem,
      body.bazi.hourBranch,
    ]]);

    // 2. 寫入紫微資料到 Sheet
    await updateSheet(sheetId, '命盤資料_紫微!A2:C2', [[
      body.ziwei.palacePosition,
      body.ziwei.flowYearPalace,
      body.ziwei.rawText || '',
    ]]);

    // 3. 更新 Firestore（標記 onboarding 完成）
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      name: body.name,
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('儲存設定失敗:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 檢查點（Phase 5）

- [ ] 訪問 `/settings` 頁面
- [ ] 點擊「建立我的專屬資料表」
- [ ] 成功建立後，表單顯示
- [ ] 填寫八字、紫微資料
- [ ] 點擊「儲存設定」
- [ ] 跳轉到首頁，可以看到每日資料

---

## 📝 Phase 6：訂閱管理

### 目標
- 建立 Subscriptions Collection
- 權限檢查中介層
- 到期提醒邏輯

### 步驟

#### 6.1 Firestore 資料結構

在 Firebase Console 手動建立 Collection：

**Collection: subscriptions**

```javascript
// 文件 ID: 自動產生
{
  subscriptionId: "sub_001",  // 也可以用文件ID
  userId: "user_123",         // 外鍵
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  status: "active",           // active | expired | cancelled
  paymentNote: "轉帳 1200 元",
  paymentDate: "2024-12-28",
  createdBy: "vannyma@gmail.com",
  createdAt: "2024-12-28T10:30:00.000Z"
}
```

---

#### 6.2 建立訂閱檢查工具

**修改檔案**：`src/lib/session-utils.ts`

新增函式：

```typescript
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase-admin/firestore';

/**
 * 檢查使用者訂閱是否有效
 */
export async function checkActiveSubscription(userId: string): Promise<boolean> {
  // 取得使用者資料
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) return false;

  const userData = userDoc.data()!;

  // Admin 永遠有效
  if (userData.accountType === 'admin') return true;

  // 免費帳號：7 天試用
  if (userData.accountType === 'free') {
    const createdAt = new Date(userData.createdAt);
    const now = new Date();
    const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreated > 7) {
      return false; // 試用期已過
    }
    return true;
  }

  // 付費帳號：查詢訂閱記錄
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const subscriptionsRef = db.collection('subscriptions');
  const q = query(
    subscriptionsRef,
    where('userId', '==', userId),
    where('status', '==', 'active'),
    where('startDate', '<=', now),
    where('endDate', '>=', now)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty; // 有任何一筆有效訂閱即可
}

/**
 * 取得使用者 sheetId（含訂閱檢查）
 */
export async function getAuthenticatedUserSheetId(): Promise<
  { sheetId: string; userId: string } | NextResponse
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const { sheetId, id: userId } = session.user;

  if (!sheetId) {
    return NextResponse.json({
      error: '請先完成初次設定',
      needsOnboarding: true
    }, { status: 403 });
  }

  // 檢查訂閱
  const hasValidSubscription = await checkActiveSubscription(userId);
  if (!hasValidSubscription) {
    return NextResponse.json({
      error: '您的訂閱已過期，請聯絡管理員續約',
      subscriptionExpired: true
    }, { status: 403 });
  }

  return { sheetId, userId };
}
```

---

#### 6.3 建立訂閱到期提醒

**建立檔案**：`src/lib/subscription-alerts.ts`

```typescript
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase-admin/firestore';

/**
 * 取得即將到期的訂閱（7 天內）
 */
export async function getExpiringSubscriptions(daysBeforeExpiry: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);

  const nowStr = now.toISOString().split('T')[0];
  const futureStr = futureDate.toISOString().split('T')[0];

  const subscriptionsRef = db.collection('subscriptions');
  const q = query(
    subscriptionsRef,
    where('status', '==', 'active'),
    where('endDate', '>=', nowStr),
    where('endDate', '<=', futureStr)
  );

  const snapshot = await getDocs(q);
  const expiringSubs: any[] = [];

  for (const doc of snapshot.docs) {
    const sub = doc.data();

    // 取得使用者資料
    const userRef = db.collection('users').doc(sub.userId);
    const userDoc = await userRef.get();

    if (userDoc.exists()) {
      const userData = userDoc.data()!;
      expiringSubs.push({
        ...sub,
        userName: userData.name,
        userEmail: userData.email,
      });
    }
  }

  return expiringSubs;
}

/**
 * 可以設定 Cron Job 每天執行，發送提醒 email
 */
export async function sendExpiryReminders() {
  const expiring = await getExpiringSubscriptions(7);

  for (const sub of expiring) {
    console.log(`⚠️ 提醒：${sub.userName} (${sub.userEmail}) 的訂閱將於 ${sub.endDate} 到期`);

    // 實際應用：發送 email 或 LINE 通知
    // await sendEmail(sub.userEmail, '訂閱即將到期', `您的訂閱將於 ${sub.endDate} 到期...`);
  }
}
```

---

### 檢查點（Phase 6）

- [ ] Firebase Console 建立 subscriptions collection
- [ ] 手動新增一筆測試訂閱（你自己的帳號）
- [ ] 測試：試用期過期的免費帳號會被擋住
- [ ] 測試：有效訂閱的帳號可以正常使用

---

## 📝 Phase 7：Admin 管理介面

### 目標
- 建立 `/admin` 路由
- 使用者列表
- 訂閱管理
- 臨時存取權限

### 步驟

#### 7.1 Admin 權限保護

**建立檔案**：`src/components/AdminGuard.tsx`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session.user.accountType !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
    </div>;
  }

  if (status === 'authenticated' && session.user.accountType === 'admin') {
    return <>{children}</>;
  }

  return null;
}
```

---

#### 7.2 Admin 總覽頁

**建立檔案**：`src/app/admin/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    freeUsers: 0,
    paidUsers: 0,
    expiringSoon: 0,
  });

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#E5E2DB] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-slate-800 mb-8 chinese-font">管理後台</h1>

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm text-slate-500 mb-2 chinese-font">總使用者數</div>
              <div className="text-4xl font-black text-slate-800">{stats.totalUsers}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm text-slate-500 mb-2 chinese-font">付費會員</div>
              <div className="text-4xl font-black text-[#8EA68F]">{stats.paidUsers}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm text-slate-500 mb-2 chinese-font">即將到期</div>
              <div className="text-4xl font-black text-[#B88A8A]">{stats.expiringSoon}</div>
            </div>
          </div>

          {/* 快速連結 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/users" className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-black text-slate-800 mb-2 chinese-font">使用者管理</h2>
              <p className="text-slate-500 chinese-font">查看、編輯所有使用者資料</p>
            </Link>

            <Link href="/admin/subscriptions" className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-black text-slate-800 mb-2 chinese-font">訂閱管理</h2>
              <p className="text-slate-500 chinese-font">管理訂閱、查看到期提醒</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
```

---

#### 7.3 使用者列表

**建立檔案**：`src/app/admin/users/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all'); // all | free | paid | admin

  useEffect(() => {
    fetch(`/api/admin/users?filter=${filter}`)
      .then(res => res.json())
      .then(data => setUsers(data));
  }, [filter]);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#E5E2DB] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-black text-slate-800 chinese-font">使用者管理</h1>
            <Link href="/admin" className="text-slate-600 hover:text-slate-800">← 返回</Link>
          </div>

          {/* 篩選器 */}
          <div className="bg-white rounded-2xl p-4 mb-6 flex gap-2">
            {['all', 'free', 'paid', 'admin'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                  filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? '全部' : f === 'free' ? '免費' : f === 'paid' ? '付費' : 'Admin'}
              </button>
            ))}
          </div>

          {/* 使用者表格 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-black text-slate-600 chinese-font">姓名</th>
                  <th className="text-left px-6 py-4 text-sm font-black text-slate-600 chinese-font">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-black text-slate-600 chinese-font">帳號類型</th>
                  <th className="text-left px-6 py-4 text-sm font-black text-slate-600 chinese-font">建立日期</th>
                  <th className="text-left px-6 py-4 text-sm font-black text-slate-600 chinese-font">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.userId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold chinese-font">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        user.accountType === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.accountType === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.accountType === 'admin' ? 'Admin' : user.accountType === 'paid' ? '付費' : '免費'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.createdAt.split('T')[0]}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user.userId}`}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        詳情 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
```

---

#### 7.4 使用者詳情頁

**建立檔案**：`src/app/admin/users/[id]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setSubscriptions(data.subscriptions);
      });
  }, [userId]);

  if (!user) return <div>載入中...</div>;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#E5E2DB] p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/users" className="text-slate-600 hover:text-slate-800 mb-4 inline-block">← 返回列表</Link>

          {/* 使用者資訊 */}
          <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-800 mb-2 chinese-font">{user.name}</h1>
                <p className="text-slate-500">{user.email}</p>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                user.accountType === 'admin' ? 'bg-purple-100 text-purple-800' :
                user.accountType === 'paid' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.accountType === 'admin' ? 'Admin' : user.accountType === 'paid' ? '付費會員' : '免費會員'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500 mb-1 chinese-font">Sheet ID</div>
                <div className="font-mono text-xs bg-slate-50 p-2 rounded">{user.sheetId}</div>
                {user.sheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${user.sheetId}/edit`}
                    target="_blank"
                    className="text-blue-600 text-xs hover:underline"
                  >
                    開啟 Sheet →
                  </a>
                )}
              </div>
              <div>
                <div className="text-slate-500 mb-1 chinese-font">建立日期</div>
                <div className="font-bold">{user.createdAt.split('T')[0]}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1 chinese-font">最後登入</div>
                <div className="font-bold">{user.lastLogin || '未記錄'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1 chinese-font">Onboarding</div>
                <div className="font-bold">{user.onboardingCompleted ? '✅ 已完成' : '❌ 未完成'}</div>
              </div>
            </div>
          </div>

          {/* 訂閱記錄 */}
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-800 mb-6 chinese-font">訂閱記錄</h2>

            {subscriptions.length === 0 ? (
              <p className="text-slate-500 chinese-font">尚無訂閱記錄</p>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub: any) => (
                  <div key={sub.subscriptionId} className="border-2 border-slate-100 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm text-slate-500 mb-1 chinese-font">訂閱期間</div>
                        <div className="font-black text-lg">{sub.startDate} ~ {sub.endDate}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' :
                        sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status === 'active' ? '進行中' : sub.status === 'expired' ? '已到期' : '已取消'}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 chinese-font">
                      <div className="mb-2">付款備註：{sub.paymentNote}</div>
                      {sub.paymentDate && <div>付款日期：{sub.paymentDate}</div>}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold">
                        編輯
                      </button>
                      <button className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-bold">
                        取消訂閱
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="mt-6 w-full py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700">
              + 新增訂閱期間
            </button>
          </div>

          {/* 備註 */}
          <div className="bg-white rounded-3xl p-8 mt-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-800 mb-4 chinese-font">備註</h2>
            <textarea
              defaultValue={user.notes || ''}
              className="w-full h-32 px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-slate-400 chinese-font"
              placeholder="記錄使用者相關資訊..."
            />
            <button className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700">
              儲存備註
            </button>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
```

---

#### 7.5 建立 Admin API

**建立檔案**：`src/app/api/admin/stats/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session-utils';
import { db } from '@/lib/firebase';

export async function GET() {
  const authCheck = await requireAdmin();
  if (authCheck !== true) return authCheck;

  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    const totalUsers = users.length;
    const freeUsers = users.filter(u => u.accountType === 'free').length;
    const paidUsers = users.filter(u => u.accountType === 'paid').length;

    // 即將到期（簡化版，完整版要查詢 subscriptions）
    const expiringSoon = 0;

    return NextResponse.json({
      totalUsers,
      freeUsers,
      paidUsers,
      expiringSoon,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**建立檔案**：`src/app/api/admin/users/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session-utils';
import { db } from '@/lib/firebase';

export async function GET(request: Request) {
  const authCheck = await requireAdmin();
  if (authCheck !== true) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let query = db.collection('users');

    if (filter !== 'all') {
      query = query.where('accountType', '==', filter);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**建立檔案**：`src/app/api/admin/users/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session-utils';
import { db } from '@/lib/firebase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdmin();
  if (authCheck !== true) return authCheck;

  try {
    const userId = params.id;

    // 取得使用者資料
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    // 取得訂閱記錄
    const subsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    const subscriptions = subsSnapshot.docs.map(doc => doc.data());

    return NextResponse.json({
      user: { userId, ...userDoc.data() },
      subscriptions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 檢查點（Phase 7）

- [ ] 以 Admin 帳號登入
- [ ] 訪問 `/admin`
- [ ] 看到統計數據
- [ ] 訪問 `/admin/users`
- [ ] 看到使用者列表
- [ ] 點擊使用者詳情
- [ ] 看到訂閱記錄

---

## 📝 Phase 8：測試與部署

### 目標
- 完整的多帳號測試
- 邊界情況測試
- 正式部署

### 測試清單

#### 8.1 註冊與登入

- [ ] 新使用者可以用 Google 登入
- [ ] 登入後導向 /settings
- [ ] 點擊「建立專屬資料表」成功
- [ ] Google Drive 出現新 Sheet
- [ ] Firestore 出現使用者資料

#### 8.2 Onboarding

- [ ] 填寫個人資訊、八字、紫微
- [ ] 點擊「儲存設定」成功
- [ ] 資料寫入使用者的 Sheet
- [ ] 導向首頁

#### 8.3 多使用者隔離

- [ ] 建立帳號 A，儲存資料
- [ ] 建立帳號 B，儲存資料
- [ ] 帳號 A 看不到帳號 B 的資料 ✅
- [ ] 帳號 B 看不到帳號 A 的資料 ✅

#### 8.4 訂閱管理

- [ ] 免費帳號 7 天後被擋住
- [ ] 付費帳號可以正常使用
- [ ] 訂閱到期後被擋住

#### 8.5 Admin 功能

- [ ] Admin 可以看到所有使用者
- [ ] Admin 可以編輯訂閱
- [ ] Admin 可以開啟使用者的 Sheet

---

### 部署步驟

#### 8.6 部署到正式站

```bash
# 確認 dev 分支測試完成
git checkout dev
git status

# 合併到 main
git checkout main
git merge dev

# 推送到 GitHub
git push origin main

# Vercel 會自動部署到正式站
```

---

## ✅ 完成檢查表

### Phase 1: 環境準備
- [ ] Git dev 分支已建立
- [ ] Vercel 雙環境已設定
- [ ] Firebase 專案已建立
- [ ] Firestore 安全規則已設定
- [ ] 環境變數已設定

### Phase 2: Google OAuth
- [ ] NextAuth.js 已安裝
- [ ] Google OAuth 應用程式已建立
- [ ] 本地測試登入成功
- [ ] Firestore 有使用者資料

### Phase 3: Sheet 複製
- [ ] 範本 Sheet 已建立
- [ ] Sheet 複製 API 正常運作
- [ ] Service Account 權限正確

### Phase 4: 資料隔離
- [ ] 所有 API 改用動態 sheetId
- [ ] 多帳號測試通過

### Phase 5: Onboarding
- [ ] /settings 頁面完成
- [ ] 八字輸入正常
- [ ] 紫微輸入正常
- [ ] 資料儲存成功

### Phase 6: 訂閱
- [ ] Firestore subscriptions 建立
- [ ] 訂閱檢查機制正常
- [ ] 到期提醒功能正常

### Phase 7: Admin
- [ ] /admin 頁面完成
- [ ] 使用者列表正常
- [ ] 使用者詳情正常
- [ ] 訂閱管理正常

### Phase 8: 部署
- [ ] 測試清單全部通過
- [ ] 部署到正式站
- [ ] 正式站運作正常

---

## 🚨 常見問題排查

### 問題 1：登入後 Session 沒有 sheetId

**原因**：session callback 沒有從 Firestore 讀取
**解決**：檢查 `src/lib/auth.ts` 的 session callback

### 問題 2：複製 Sheet 失敗

**原因**：權限不足或 access token 過期
**解決**：檢查 Google OAuth scopes 是否包含 `drive.file` 和 `spreadsheets`

### 問題 3：Firestore 讀寫失敗

**原因**：安全規則太嚴格或憑證錯誤
**解決**：檢查 Firestore 規則，檢查環境變數 `FIREBASE_*`

### 問題 4：Vercel 部署失敗

**原因**：環境變數缺失
**解決**：檢查 Vercel Project Settings → Environment Variables

---

## 📞 如何與其他 AI 協作

### 交接時提供這些資訊：

1. **這份文件**：`REFACTOR_ROADMAP.md`
2. **目前進度**：「我已完成到 Phase X」
3. **遇到的問題**：具體錯誤訊息、截圖
4. **環境資訊**：
   - Node.js 版本：`node -v`
   - npm 版本：`npm -v`
   - 目前分支：`git branch`
5. **檔案清單**：
   ```bash
   tree src -L 3 -I node_modules
   ```

### 給下一個 AI 的提示詞範本：

```
你好！我正在將 Teller 專案重構為多人 SaaS 平台。

目前進度：已完成 Phase 1-3（環境準備、OAuth 登入、Sheet 複製）

專案位置：/Users/vannyma/antigravity/01_Personal_OS/Teller

請閱讀 REFACTOR_ROADMAP.md 文件，繼續完成 Phase 4（多使用者資料隔離）。

遇到的問題：[具體描述問題]

請幫我繼續實作。
```

---

## 🎓 Git 操作備忘錄

```bash
# 查看目前分支
git branch

# 切換分支
git checkout dev

# 建立新分支
git checkout -b feature/new-feature

# 查看修改
git status
git diff

# 提交修改
git add .
git commit -m "描述修改內容"
git push origin dev

# 合併分支
git checkout main
git merge dev
git push origin main

# 如果推送失敗（遠端有更新）
git pull origin main
git push origin main

# 查看提交紀錄
git log --oneline --graph --all
```

---

## 📚 參考資料

- [NextAuth.js 文件](https://next-auth.js.org/)
- [Firebase Firestore 文件](https://firebase.google.com/docs/firestore)
- [Google Sheets API](https://devers.google.com/sheets/api)
- [Google Drive API](https://devers.google.com/drive/api)
- [Vercel 部署文件](https://vercel.com/docs)

---

**文件版本**：v1.0
**最後更新**：2025-02-12
**維護者**：vannyma

---

## 💬 結語

這份文件涵蓋了從單人版到多人版的完整重構過程。按照步驟進行，每個 Phase 都有明確的檢查點，確保進度穩健。

如果遇到問題，可以：
1. 先檢查「常見問題排查」章節
2. 查看相關 API 文件
3. 使用這份文件與其他 AI 協作

祝重構順利！🚀
