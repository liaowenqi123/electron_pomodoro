/**
 * 计时器模块
 */
;(function() {
  'use strict'

  let elements = {}
  let callbacks = {}
  let totalTime = 25 * 60
  let timeLeft = totalTime
  let timerId = null
  let isRunning = false
  let minuteCounter = 0  // 用于跟踪分钟数

  const radius = 116
  const circumference = 2 * Math.PI * radius

  // 使用统一的格式化函数
  const formatTime = Utils.formatTime

  function updateDisplay() {
    elements.timeDisplay.textContent = formatTime(timeLeft)
    const progress = (totalTime - timeLeft) / totalTime
    elements.progressCircle.style.strokeDashoffset = circumference * (1 - progress)
  }

  function start() {
    if (timeLeft === 0) timeLeft = totalTime
    isRunning = true
    minuteCounter = 0  // 重置分钟计数器
    elements.startBtn.textContent = '暂停'
    
    if (callbacks.onStart) {
      callbacks.onStart()
    }
    
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange('running')
    }
    
    if (callbacks.onEnabledChange) {
      callbacks.onEnabledChange(false)
    }
    
    timerId = setInterval(() => {
      timeLeft--
      minuteCounter++
      updateDisplay()
      
      // 每过1分钟，通知菜园子更新作物进度
      if (minuteCounter >= 60 && window.Garden) {
        window.Garden.updateProgress()
        minuteCounter = 0  // 重置计数器
      }
      
      if (timeLeft === 0) {
        clearInterval(timerId)
        isRunning = false
        minuteCounter = 0  // 重置分钟计数器
        elements.startBtn.textContent = '开始'
        
        if (callbacks.onComplete) {
          callbacks.onComplete()
        }
      }
    }, 1000)
  }

  function pause() {
    isRunning = false
    clearInterval(timerId)
    elements.startBtn.textContent = '继续'
    
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange('paused')
    }
  }

  function reset() {
    clearInterval(timerId)
    isRunning = false
    timeLeft = totalTime
    updateDisplay()
    elements.startBtn.textContent = '开始'
    elements.progressCircle.style.strokeDashoffset = 0
    
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange('ready')
    }
    
    if (callbacks.onEnabledChange) {
      callbacks.onEnabledChange(true)
    }
  }

  function toggle() {
    // 专注模式下禁止暂停，只能通过重置按钮中断
    if (isRunning && AppState && AppState.focusModeEnabled) {
      return // 专注模式下运行中时点击无效
    }
    isRunning ? pause() : start()
  }

  function setTime(minutes) {
    if (isRunning) return
    totalTime = minutes * 60
    timeLeft = totalTime
    updateDisplay()
    elements.progressCircle.style.strokeDashoffset = 0
  }

  function getTimeLeft() {
    return timeLeft
  }

  function getTotalTime() {
    return totalTime
  }

  function getIsRunning() {
    return isRunning
  }

  function init(els, cbs) {
    elements = els
    callbacks = cbs || {}
    
    elements.progressCircle.style.strokeDasharray = circumference
    elements.progressCircle.style.strokeDashoffset = 0
    
    elements.startBtn.addEventListener('click', toggle)
    
    updateDisplay()
  }

  // 导出到全局
  window.Timer = {
    init: init,
    start: start,
    pause: pause,
    reset: reset,
    toggle: toggle,
    setTime: setTime,
    getTimeLeft: getTimeLeft,
    getTotalTime: getTotalTime,
    getIsRunning: getIsRunning
  }
})()