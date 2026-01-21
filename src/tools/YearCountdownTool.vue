<template>
  <div class="tool-card">
    <h2 class="tool-title">年度倒计时</h2>

    <div class="year-countdown-widget">
      <div class="widget-header">
        <div class="widget-year">{{ currentYear }}</div>
        <div class="widget-percentage">{{ progressPercentage }}%</div>
      </div>

      <div class="widget-progress-grid">
        <div
          v-for="(day, index) in totalDays"
          :key="index"
          :class="['progress-dot', { 'completed': index < passedDays }]"
          :title="`第 ${index + 1} 天`"
        ></div>
      </div>

      <div class="widget-footer">
        <div class="widget-remaining">
          <span class="remaining-days">{{ remainingDays }}</span>
          <span class="remaining-label">天剩余</span>
        </div>
      </div>

      <div class="widget-stats">
        <div class="stat-item">
          <div class="stat-label">已过天数</div>
          <div class="stat-value">{{ passedDays }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">总天数</div>
          <div class="stat-value">{{ totalDays }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">今日日期</div>
          <div class="stat-value">{{ todayDate }}</div>
        </div>
      </div>
    </div>

    <div class="widget-actions">
      <button class="btn secondary" @click="refreshData">刷新</button>
      <button class="btn secondary" @click="copyToClipboard">复制信息</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const currentYear = ref(new Date().getFullYear());
const today = ref(new Date());
const updateInterval = ref<ReturnType<typeof setInterval> | null>(null);

// 计算年度第一天
const yearStart = computed(() => {
  return new Date(currentYear.value, 0, 1);
});

// 计算年度最后一天
const yearEnd = computed(() => {
  return new Date(currentYear.value, 11, 31);
});

// 计算总天数
const totalDays = computed(() => {
  const diffTime = yearEnd.value.getTime() - yearStart.value.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 包括第一天
});

// 计算已过天数
const passedDays = computed(() => {
  const diffTime = today.value.getTime() - yearStart.value.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 包括今天
  return Math.max(0, Math.min(days, totalDays.value));
});

// 计算剩余天数
const remainingDays = computed(() => {
  return Math.max(0, totalDays.value - passedDays.value);
});

// 计算进度百分比
const progressPercentage = computed(() => {
  if (totalDays.value === 0) return 0;
  return Math.round((passedDays.value / totalDays.value) * 100);
});

// 今日日期字符串
const todayDate = computed(() => {
  const year = today.value.getFullYear();
  const month = String(today.value.getMonth() + 1).padStart(2, '0');
  const day = String(today.value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// 刷新数据
function refreshData() {
  today.value = new Date();
  currentYear.value = today.value.getFullYear();
}

// 复制信息到剪贴板
async function copyToClipboard() {
  const info = `年度倒计时 ${currentYear.value}
进度: ${progressPercentage.value}%
已过: ${passedDays.value} 天
剩余: ${remainingDays.value} 天
总天数: ${totalDays.value} 天
今日: ${todayDate.value}`;

  try {
    await navigator.clipboard.writeText(info);
    // 可以添加一个提示消息
    alert('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  }
}

// 每分钟更新一次（确保跨天时自动更新）
onMounted(() => {
  refreshData();
  // 每分钟检查一次是否需要更新
  updateInterval.value = setInterval(() => {
    const now = new Date();
    // 如果日期或年份发生变化，更新数据
    if (
      now.getDate() !== today.value.getDate() ||
      now.getMonth() !== today.value.getMonth() ||
      now.getFullYear() !== today.value.getFullYear()
    ) {
      refreshData();
    }
  }, 60000); // 每分钟检查一次
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});
</script>

<style scoped>
.year-countdown-widget {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.widget-year {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.widget-percentage {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.widget-progress-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  gap: 2px;
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.progress-dot {
  aspect-ratio: 1;
  border-radius: 50%;
  background: #000000;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 3px;
}

.progress-dot.completed {
  background: #ffffff;
}

.progress-dot:hover {
  transform: scale(1.2);
  z-index: 1;
  position: relative;
}

.widget-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.widget-remaining {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.remaining-days {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.remaining-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.widget-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.widget-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

/* 浅色主题适配 */
.app.light-theme .widget-progress-grid {
  background: rgba(0, 0, 0, 0.05);
}

.app.light-theme .progress-dot {
  background: #000000;
}

.app.light-theme .progress-dot.completed {
  background: #ffffff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .year-countdown-widget {
    max-width: 100%;
    padding: 12px;
  }

  .widget-progress-grid {
    grid-template-columns: repeat(15, 1fr);
    gap: 2px;
    padding: 8px;
  }

  .widget-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .remaining-days {
    font-size: 20px;
  }

  .widget-year,
  .widget-percentage {
    font-size: 16px;
  }
}
</style>
