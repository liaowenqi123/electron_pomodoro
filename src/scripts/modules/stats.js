/**
 * 统计模块
 */
;(function() {
  'use strict'

  let elements = {}
  let todayCount = 0
  let totalMinutes = 0

  function load() {
    const today = new Date().toDateString()
    const savedStats = localStorage.getItem('pomodoroStats')
    
    if (savedStats) {
      const stats = JSON.parse(savedStats)
      if (stats.date === today) {
        todayCount = stats.todayCount || 0
        totalMinutes = stats.totalMinutes || 0
      } else {
        todayCount = 0
        totalMinutes = stats.totalMinutes || 0
      }
    }
    updateDisplay()
  }

  function save() {
    localStorage.setItem('pomodoroStats', JSON.stringify({
      date: new Date().toDateString(),
      todayCount: todayCount,
      totalMinutes: totalMinutes
    }))
  }

  function updateDisplay() {
    if (elements.todayCount) {
      elements.todayCount.textContent = todayCount
    }
    if (elements.totalMinutes) {
      elements.totalMinutes.textContent = totalMinutes
    }
  }

  function increment(minutes) {
    todayCount++
    totalMinutes += minutes
    updateDisplay()
    save()
  }

  function getTodayCount() {
    return todayCount
  }

  function getTotalMinutes() {
    return totalMinutes
  }

  function init(els) {
    elements = els
    load()
  }

  // 导出到全局
  window.Stats = {
    init: init,
    load: load,
    save: save,
    increment: increment,
    updateDisplay: updateDisplay,
    getTodayCount: getTodayCount,
    getTotalMinutes: getTotalMinutes
  }
})()