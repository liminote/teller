# Liminote Daily（每日隙音）

**Listen to the space between**
**聆聽時間的隙縫**

---

## 關於 Liminote Daily

Liminote Daily（每日隙音）是一個個人能量覺察系統，結合紫微斗數與八字曆法，提供每日能量指引。

在過去與未來之間，在命運與選擇之間，有一個「隙縫」（liminal space）。Liminote Daily 幫助你聆聽這個隙縫中的訊息，用過去的經驗做出更好的決策。

### 核心理念

- ✅ **不是宿命論**：不是被命運指定，而是自己做決定
- ✅ **趨吉避凶**：透過數據找出個人模式，提升決策品質
- ✅ **自我覺察**：每日記錄與反思，增強對自己的理解
- ✅ **溫柔陪伴**：每日隙音，不強迫但不缺席

### 主要功能

- 📅 **每日能量指引**：根據八字與紫微斗數計算每日運勢
- 📝 **每日回饋記錄**：記錄生活體驗、情緒狀態
- 📊 **數據分析**：找出個人的吉凶模式
- 🔬 **模式實驗室**：深度探索天象與生活的關聯

---

## 技術架構

- **框架**：Next.js 16 (React 19)
- **語言**：TypeScript
- **樣式**：Tailwind CSS 4
- **動畫**：Framer Motion
- **資料庫**：Google Sheets API
- **命理運算**：
  - lunar-javascript（農曆轉換）
  - 自建紫微斗數計算引擎
  - 八字干支運算

---

## 開發指南

### 安裝依賴

```bash
npm install
```

### 環境變數設定

複製 `.env.local.example` 為 `.env.local`，並填入以下變數：

```bash
# Google Sheets API
GOOGLE_SHEETS_ID=你的試算表ID
GOOGLE_API_KEY=你的API金鑰
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=憑證檔案路徑

# 登入密碼
SITE_PASSWORD=你的密碼
```

### 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置

```bash
npm run build
npm start
```

---

## 專案結構

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首頁（今日能量）
│   ├── dashboard/         # 數據分析
│   ├── patterns/          # 模式實驗室
│   ├── login/             # 登入頁
│   └── api/               # API 路由
├── components/            # React 元件
├── lib/                   # 工具函式庫
│   ├── google-sheets.ts   # Google Sheets 客戶端
│   ├── calendar-utils.ts  # 農曆與八字計算
│   └── purple-palace-calculator.ts  # 紫微斗數運算
├── data/                  # 預先計算的曆法資料
└── scripts/               # 工具腳本
```

---

## 部署

推薦部署到 [Vercel](https://vercel.com)：

```bash
vercel deploy
```

---

## 授權

Private - 僅供個人使用

---

## 關於 Liminote

Liminote（隙音）是一個專注於「過渡空間」（liminal space）的品牌。

我們相信，最有力量的時刻，往往發生在兩個狀態之間——
黎明、門檻、選擇的瞬間。

在這些隙縫中，傳來微弱但清晰的訊息。
我們幫助你聆聽這些訊息，做出屬於你的選擇。

**Liminote Daily** 是 Liminote 品牌的第一個產品。

---

_Listen to the space between_
_聆聽時間的隙縫_
