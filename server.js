const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const ADMIN_PASSWORD = '1234';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const state = {
  count: 0,
  running: false,
  startTime: null,
  accumulated: 0,
  userCount: 0,
};

// 追蹤管理員連線
const adminConnections = new Set();

const getElapsedMilliseconds = () => {
  if (state.running && state.startTime) {
    return state.accumulated + (Date.now() - state.startTime);
  }
  return state.accumulated;
};

const getStatePayload = () => ({
  count: state.count,
  running: state.running,
  elapsed: getElapsedMilliseconds(),
  userCount: state.userCount,
});

const startSession = () => {
  if (!state.running) {
    state.running = true;
    state.startTime = Date.now();
  }
};

const stopSession = () => {
  if (state.running) {
    state.accumulated += Date.now() - state.startTime;
    state.running = false;
    state.startTime = null;
  }
};

const resetSession = () => {
  state.count = 0;
  state.running = false;
  state.startTime = null;
  state.accumulated = 0;
  // 注意：不重置 userCount，因為使用者可能仍然連線
};

const broadcastState = () => {
  io.emit('state:update', getStatePayload());
};

io.on('connection', (socket) => {
  console.log(`新連線建立，Socket ID: ${socket.id}`);
  socket.emit('state:update', getStatePayload());
  
  // 設置一個延遲計時器，如果 5 秒內沒有管理員認證，則計入一般使用者
  socket.userCountTimer = setTimeout(() => {
    if (!adminConnections.has(socket.id)) {
      state.userCount += 1;
      console.log(`一般使用者連線（延遲計入），目前使用者數量: ${state.userCount}`);
      broadcastState();
    }
  }, 5000);

  socket.on('count:increment', () => {
    if (!state.running) {
      return;
    }
    state.count += 1;
    broadcastState();
  });

  socket.on('admin:authenticate', (password, callback) => {
    const success = password === ADMIN_PASSWORD;
    if (success) {
      // 標記為管理員連線
      adminConnections.add(socket.id);
      console.log(`管理員連線認證成功，Socket ID: ${socket.id}`);
      // 清除延遲計時器，因為這是管理員連線
      if (socket.userCountTimer) {
        clearTimeout(socket.userCountTimer);
        socket.userCountTimer = null;
      }
    } else {
      // 如果不是管理員，則計入一般使用者數量
      if (!adminConnections.has(socket.id)) {
        state.userCount += 1;
        console.log(`一般使用者連線，目前使用者數量: ${state.userCount}`);
        broadcastState();
      }
    }
    if (typeof callback === 'function') {
      callback(success);
    }
  });

  socket.on('admin:start', () => {
    startSession();
    broadcastState();
  });

  socket.on('admin:stop', () => {
    stopSession();
    broadcastState();
  });

  socket.on('admin:reset', () => {
    resetSession();
    broadcastState();
  });

  socket.on('disconnect', () => {
    console.log(`連線斷開，Socket ID: ${socket.id}`);
    
    // 清除延遲計時器
    if (socket.userCountTimer) {
      clearTimeout(socket.userCountTimer);
      socket.userCountTimer = null;
    }
    
    if (adminConnections.has(socket.id)) {
      // 如果是管理員連線，只移除管理員標記
      adminConnections.delete(socket.id);
      console.log(`管理員連線斷開`);
    } else {
      // 如果是一般使用者連線，減少使用者計數
      state.userCount = Math.max(0, state.userCount - 1);
      console.log(`一般使用者連線斷開，目前使用者數量: ${state.userCount}`);
      broadcastState();
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Mind wander counter running on port ${port}`);
});
