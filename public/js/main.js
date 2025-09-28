const socket = io();

const countEl = document.getElementById('count');
const timerEl = document.getElementById('timer');
const incrementBtn = document.getElementById('increment');
const statusBadge = document.getElementById('status');
const statusText = document.getElementById('status-text');

let elapsed = 0;
let running = false;
let timerInterval = null;

const formatElapsed = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
  }

  return [minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
};

const updateTimer = () => {
  const now = Date.now();
  timerEl.textContent = formatElapsed(elapsed + (running ? now - timerInterval.start : 0));
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

const renderState = (state) => {
  countEl.textContent = state.count;
  elapsed = state.elapsed;
  running = state.running;

  if (running) {
    statusBadge.classList.remove('stopped');
    statusText.textContent = '計時中';
    incrementBtn.disabled = false;
    startTimer();
  } else {
    statusBadge.classList.add('stopped');
    statusText.textContent = '已暫停';
    incrementBtn.disabled = true;
    stopTimer();
  }

  updateTimer();
};

socket.on('state:update', renderState);

incrementBtn.addEventListener('click', () => {
  incrementBtn.classList.add('active');
  socket.emit('count:increment');
  setTimeout(() => incrementBtn.classList.remove('active'), 120);
});
