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
const statisticsButton = document.getElementById('statistics');
const statisticsSection = document.getElementById('statistics-section');
const testOutput = document.getElementById('test-output');

let isAuthenticated = false;
let running = false;
let elapsed = 0;
let timerInterval = null;
let statisticsChart = null;

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

// 統計檢定功能
const performStatisticalTest = async () => {
  if (!isAuthenticated) return;
  
  try {
    // 獲取統計數據
    const response = await fetch('/api/statistics');
    const data = await response.json();
    
    if (data.error) {
      testOutput.innerHTML = `<div style="color: #ef4444;">錯誤: ${data.error}</div>`;
      return;
    }
    
    // 計算統計量
    const sampleMean = data.perMinuteRate;
    const sampleSize = data.userCount;
    const populationMean = 0.25; // 對比基準
    const sampleStd = data.perMinuteStd || 0.1; // 假設標準差，實際應用中需要更多數據
    
    // One-tail t-test (左尾檢定：檢定是否小於 0.25)
    const tStatistic = (sampleMean - populationMean) / (sampleStd / Math.sqrt(sampleSize));
    const degreesOfFreedom = sampleSize - 1;
    
    // 計算 p-value (使用 jStat) - 左尾檢定
    const pValue = jStat.studentt.cdf(tStatistic, degreesOfFreedom);
    
    // 顯示結果
    testOutput.innerHTML = `
      <div><strong>樣本統計量:</strong></div>
      <div>• 樣本平均數: ${sampleMean.toFixed(3)}</div>
      <div>• 樣本大小: ${sampleSize}</div>
      <div>• 樣本標準差: ${sampleStd.toFixed(3)}</div>
      <div><br><strong>One-tail t-test 結果:</strong></div>
      <div>• 虛無假設 H₀: μ ≥ 0.25</div>
      <div>• 對立假設 H₁: μ < 0.25</div>
      <div>• t 統計量: ${tStatistic.toFixed(3)}</div>
      <div>• 自由度: ${degreesOfFreedom}</div>
      <div>• p-value: ${pValue.toFixed(4)}</div>
      <div><br><strong>結論:</strong></div>
      <div style="color: ${pValue < 0.05 ? '#ef4444' : '#10b981'};">
        ${pValue < 0.05 ? 
          `拒絕虛無假設 (p < 0.05)，有顯著證據顯示平均每分鐘分心次數小於 0.25` : 
          `無法拒絕虛無假設 (p ≥ 0.05)，沒有顯著證據顯示平均每分鐘分心次數小於 0.25`
        }
      </div>
    `;
    
    // 創建圖表
    createStatisticsChart(sampleMean, populationMean);
    
    // 顯示統計區域
    statisticsSection.classList.remove('hidden');
    
  } catch (error) {
    console.error('統計檢定錯誤:', error);
    testOutput.innerHTML = `<div style="color: #ef4444;">統計檢定執行失敗: ${error.message}</div>`;
  }
};

const createStatisticsChart = (sampleMean, populationMean) => {
  const ctx = document.getElementById('statistics-chart').getContext('2d');
  
  // 銷毀現有圖表
  if (statisticsChart) {
    statisticsChart.destroy();
  }
  
  statisticsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['每分鐘分心次數'],
      datasets: [{
        label: '樣本平均數',
        data: [sampleMean],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '每分鐘分心次數統計檢定結果',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(sampleMean * 1.5, populationMean * 1.5, 0.5),
          title: {
            display: true,
            text: '每分鐘分心次數'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: '統計指標'
          }
        }
      }
    }
  });
  
  // 添加虛線標記 0.25
  const chart = statisticsChart;
  const yScale = chart.scales.y;
  const xScale = chart.scales.x;
  
  // 繪製虛線
  chart.ctx.save();
  chart.ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
  chart.ctx.lineWidth = 2;
  chart.ctx.setLineDash([5, 5]);
  chart.ctx.beginPath();
  const yPos = yScale.getPixelForValue(populationMean);
  chart.ctx.moveTo(xScale.left, yPos);
  chart.ctx.lineTo(xScale.right, yPos);
  chart.ctx.stroke();
  chart.ctx.restore();
  
  // 添加標籤
  chart.ctx.save();
  chart.ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
  chart.ctx.font = '12px Arial';
  chart.ctx.textAlign = 'right';
  chart.ctx.fillText(`對比基準: ${populationMean}`, xScale.right - 10, yPos - 5);
  chart.ctx.restore();
};

// 統計按鈕事件監聽器
statisticsButton.addEventListener('click', performStatisticalTest);
