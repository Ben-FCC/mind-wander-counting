const socket = io();

// 調試連線狀態
socket.on('connect', () => {
  console.log('Socket.IO 連線成功');
});

socket.on('disconnect', () => {
  console.log('Socket.IO 連線斷開');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO 連線錯誤:', error);
});

const authSection = document.getElementById('auth-section');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login');
const loginStatus = document.getElementById('login-status');

const dashboard = document.getElementById('dashboard');
const sessionStatus = document.getElementById('session-status');
const adminCount = document.getElementById('admin-count');
const userCount = document.getElementById('user-count');
const adminTimer = document.getElementById('admin-timer');
const perMinute = document.getElementById('per-minute');
const stateText = document.getElementById('state-text');

const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');

let isAuthenticated = false;
let running = false;
let elapsed = 0;
let timerInterval = null;

const formatElapsed = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return parts.map((n) => String(n).padStart(2, '0')).join(':');
};

const updateTimer = () => {
  const now = Date.now();
  const currentElapsed = elapsed + (running && timerInterval ? now - timerInterval.start : 0);
  adminTimer.textContent = formatElapsed(currentElapsed);
};

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval.id);
  }
  timerInterval = {
    start: Date.now(),
    id: setInterval(updateTimer, 1000),
  };
  updateTimer();
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval.id);
    timerInterval = null;
  }
  updateTimer();
};

const updatePerMinute = (count, elapsedMs, userCount) => {
  if (elapsedMs === 0 || userCount === 0) {
    perMinute.textContent = '0.0';
    return;
  }
  // 計算平均每人每分鐘分心次數
  const perMinuteValue = (count / userCount) / (elapsedMs / 60000);
  perMinute.textContent = perMinuteValue.toFixed(1);
};

const renderState = (state) => {
  running = state.running;
  elapsed = state.elapsed;

  console.log('收到狀態更新:', state);
  adminCount.textContent = state.count;
  userCount.textContent = state.userCount;
  updatePerMinute(state.count, state.elapsed, state.userCount);

  if (running) {
    sessionStatus.classList.remove('stopped');
    sessionStatus.textContent = '計時中';
    stateText.textContent = '活動進行中，參與者可以按下按鈕。';
    startTimer();
  } else {
    sessionStatus.classList.add('stopped');
    sessionStatus.textContent = '已暫停';
    stateText.textContent = '活動已暫停，按「開始」重新啟動。';
    stopTimer();
  }

  updateTimer();
};

socket.on('state:update', renderState);

loginButton.addEventListener('click', () => {
  const password = passwordInput.value.trim();
  if (!password) {
    loginStatus.textContent = '請輸入密碼。';
    return;
  }

  socket.emit('admin:authenticate', password, (success) => {
    if (success) {
      isAuthenticated = true;
      authSection.classList.add('hidden');
      dashboard.classList.remove('hidden');
      loginStatus.textContent = '';
    } else {
      loginStatus.textContent = '密碼錯誤，請再試一次。';
      passwordInput.value = '';
      passwordInput.focus();
    }
  });
});

[startButton, stopButton, resetButton].forEach((button) => {
  button.addEventListener('click', () => {
    if (!isAuthenticated) {
      loginStatus.textContent = '請先登入管理員。';
      return;
    }
  });
});

startButton.addEventListener('click', () => {
  if (!isAuthenticated) return;
  socket.emit('admin:start');
});

stopButton.addEventListener('click', () => {
  if (!isAuthenticated) return;
  socket.emit('admin:stop');
});

resetButton.addEventListener('click', () => {
  if (!isAuthenticated) return;
  if (confirm('確定要重置所有計數與時間嗎？')) {
    socket.emit('admin:reset');
  }
});

passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loginButton.click();
  }
});
