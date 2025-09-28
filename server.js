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
};

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
};

const broadcastState = () => {
  io.emit('state:update', getStatePayload());
};

io.on('connection', (socket) => {
  socket.emit('state:update', getStatePayload());

  socket.on('count:increment', () => {
    if (!state.running) {
      return;
    }
    state.count += 1;
    broadcastState();
  });

  socket.on('admin:authenticate', (password, callback) => {
    const success = password === ADMIN_PASSWORD;
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
    // no-op currently
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
