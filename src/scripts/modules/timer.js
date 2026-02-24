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

  const radius = 116
  const circumference = 2 * Math.PI * radius

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function updateDisplay() {
    elements.timeDisplay.textContent = formatTime(timeLeft)
    const progress = (totalTime - timeLeft) / totalTime
    elements.progressCircle.style.strokeDashoffset = circumference * (1 - progress)
  }

  function start() {
    if (timeLeft === 0) timeLeft = totalTime
    isRunning = true
    elements.startBtn.textContent = '暂停'
    
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange('running')
    }
    
    if (callbacks.onEnabledChange) {
      callbacks.onEnabledChange(false)
    }
    
    timerId = setInterval(() => {
      timeLeft--
      updateDisplay()
      
      if (timeLeft === 0) {
        clearInterval(timerId)
        isRunning = false
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