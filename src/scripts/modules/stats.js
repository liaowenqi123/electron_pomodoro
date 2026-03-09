/**
 * 统计模块 - 使用 JSON 文件存储
 */
;(function() {
  'use strict'

  let elements = {}

  function updateDisplay() {
    const stats = DataStore.getStats()
    
    if (elements.todayCount) {
      elements.todayCount.textContent = stats.todayCount || 0
    }
    if (elements.totalMinutes) {
      elements.totalMinutes.textContent = stats.totalMinutes || 0
    }
  }

  async function increment(minutes) {
    const stats = DataStore.getStats()
    const data = DataStore.getData()
    
    // 更新统计
    const newStats = {
      date: new Date().toDateString(),
      todayCount: (stats.todayCount || 0) + 1,
      totalMinutes: (stats.totalMinutes || 0) + minutes
    }
    
    await DataStore.updateStats(newStats)
    
    // 记录到历史数据
    const today = new Date().toISOString().split('T')[0]
    if (!data.statisticsHistory) {
      data.statisticsHistory = []
    }
    
    // 查找今天的记录
    let todayRecord = data.statisticsHistory.find(item => item.date === today)
    if (todayRecord) {
      todayRecord.count += 1
      todayRecord.minutes += minutes
    } else {
      data.statisticsHistory.push({
        date: today,
        count: 1,
        minutes: minutes
      })
    }
    
    // 保存历史数据
    await window.electronAPI.writeData(data)
    
    updateDisplay()
  }

  function getTodayCount() {
    const stats = DataStore.getStats()
    return stats.todayCount || 0
  }

  function getTotalMinutes() {
    const stats = DataStore.getStats()
    return stats.totalMinutes || 0
  }

  function init(els) {
    elements = els
    updateDisplay()
  }

  // 导出到全局
  window.Stats = {
    init: init,
    updateDisplay: updateDisplay,
    increment: increment,
    getTodayCount: getTodayCount,
    getTotalMinutes: getTotalMinutes
  }
})()
