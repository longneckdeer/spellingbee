# 超級拼字王 Super Spelling Champion

多人線上淘汰制英文拼字遊戲，使用 Cloudflare Durable Objects（WebSocket）與 Vue.js 打造，介面為繁體中文。

**線上遊玩**: https://spellingisfun.pages.dev

## 遊戲特色

- **五個難度等級** — 依據台灣教育部課綱分級（小學、中學、高中、大學、英文高手）
- **即時多人對戰** — 透過 WebSocket 即時連線，最多 25 人同場競技
- **淘汰生存制** — 每輪答錯即淘汰，存活到最後的就是拼字王
- **9,169 個單字** — 完整英文定義、例句、詞性標注
- **9,290 個發音檔** — 來自 Merriam-Webster 字典的專業發音
- **排行榜與經驗值** — 記錄每場遊戲成績與歷史排名

## 遊戲流程

選擇難度 → 進入教室 → 入座準備 → 聽題拼字 → 淘汰排名

## 難度分級

| 等級 | 名稱 | 單字數 | 難度範圍 | 來源 |
|------|------|--------|----------|------|
| 1 | 小學 | 378 | 0-30 | 教育部 1200 基礎字彙 |
| 2 | 中學 | 1,018 | 31-50 | 教育部 1200 字彙 + CEFR A2/B1 |
| 3 | 高中 | 4,624 | 51-70 | CEFR B2 + 大考中心字表 |
| 4 | 大學 | 3,003 | 71-90 | CEFR C1-C2 學術字彙 |
| 5 | 英文高手 | 146 | 91-100 | SAT/GRE 進階字彙 |

## 技術架構

```
前端 (Vue 3 + Vite)          後端 (Cloudflare Workers)
┌─────────────────┐          ┌──────────────────────┐
│  Cloudflare     │ WebSocket│  Durable Objects     │
│  Pages          │◄────────►│  (GameRoom)          │
│                 │          │                      │
│  - Vue 3 SPA   │          │  - 遊戲邏輯           │
│  - 響應式設計    │          │  - 房間管理           │
│  - TTS 語音     │          │  - 計時與淘汰         │
└─────────────────┘          └──────────────────────┘
```

## 專案結構

```
src/
├── components/              # Vue 元件
│   ├── RoomPicker.vue       #   難度選擇頁
│   ├── TheRoom.vue          #   房間大廳
│   ├── Classroom.vue        #   教室主畫面（25 個座位）
│   ├── TableCell.vue        #   玩家座位
│   ├── SpellingArea.vue     #   拼字輸入區
│   ├── Blackboard.vue       #   黑板（顯示題目）
│   ├── CurrentResults.vue   #   本輪結果
│   └── LastGameRanking.vue  #   最終排名
├── composables/
│   └── useWebSocket.js      # WebSocket 連線管理
├── stores/
│   └── gameStore.js         # 遊戲狀態管理（reactive）
├── services/
│   ├── tts.js               # 語音合成服務
│   └── soundEffects.js      # 音效服務
├── config/
│   └── game.js              # 遊戲設定（計時、座位數等）
├── gameTypes/
│   └── english-spelling/
│       ├── index.js          # 遊戲類型插件
│       └── data/             # 字典資料（JSON）
├── server/
│   ├── GameRoom.js           # Durable Object（遊戲房間邏輯）
│   └── worker-do-only.js     # Worker 進入點
└── public/
    └── audio/                # MP3 發音檔（9,290 個）
```

## 開始使用

### 環境需求

- Node.js 18+
- npm

### 安裝與開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 測試

```bash
# 單元測試
npm run test

# E2E 瀏覽器測試
npm run test:e2e
```

### 部署

```bash
# 部署前端 + 後端到 Cloudflare
npm run deploy:prod

# 僅部署 Worker（後端）
npm run deploy:worker

# 僅部署 Pages（前端）
npm run deploy:preview
```

## 環境變數

執行字典工具腳本時需要設定 Merriam-Webster API 金鑰：

```bash
export MW_COLLEGIATE_KEY="你的金鑰"
export MW_LEARNERS_KEY="你的金鑰"
```

可至 [dictionaryapi.com](https://www.dictionaryapi.com/) 免費申請。

## 授權

MIT
