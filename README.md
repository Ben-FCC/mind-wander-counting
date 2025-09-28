# Mind Wander Counting

一個可以同步記錄所有人 mind wander 次數的簡潔網頁工具，包含一般使用者頁面與管理員後台。

## 功能

- 大型觸控友善的「我分心了」按鈕，適合手機與電腦使用。
- 即時顯示累計分心次數與計時。
- 多人同時在線，透過 WebSocket 即時同步。
- 管理員後台可登入（密碼：`1234`）後控制開始、暫停、重置，以及查看即時統計。

## 使用方式

```bash
npm install
npm start
```

預設會在 `http://localhost:3000` 啟動：

- `http://localhost:3000/`：使用者頁面。
- `http://localhost:3000/admin`：管理員後台。

## 專案結構

```
public/
  css/
    styles.css      # 共用樣式
    admin.css       # 管理員後台額外樣式
  js/
    main.js         # 使用者頁面互動邏輯
    admin.js        # 管理員後台互動邏輯
  index.html        # 使用者頁面
  admin.html        # 管理員頁面
server.js            # Express + Socket.IO 伺服器
```
