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
    
    // 更新统计
    const newStats = {
      date: new Date().toDateString(),
      todayCount: (stats.todayCount || 0) + 1,
      totalMinutes: (stats.totalMinutes || 0) + minutes
    }
    
    await DataStore.updateStats(newStats)
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
