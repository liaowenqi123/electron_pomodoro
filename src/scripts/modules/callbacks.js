/**
 * 番茄钟 - 回调函数定义
 */
;(function() {
  'use strict'

  /**
   * 获取计时器回调
   */
  function getTimerCallbacks() {
    return {
      onStart: () => {
        // 计划模式下，只有在计划未开始时才初始化
        if (AppState.appMode === 'plan') {
          const status = PlanMode.getPlanStatus()
          if (!status.isRunning) {
            PlanMode.startPlan()
          }
        }
        // 专注模式开启且计时器开始时，启动前台检测
        if (AppState.focusModeEnabled && window.ForegroundDetection) {
          window.ForegroundDetection.startDetection()
        }
        
        // 单次模式下，自动确认备注输入
        if (AppState.appMode === 'single') {
          const timerNoteInput = document.getElementById('timerNoteInput')
          const timerNoteDisplay = document.getElementById('timerNoteDisplay')
          const timerNoteTitleInput = document.getElementById('timerNoteTitleInput')
          const timerNoteText = document.getElementById('timerNoteText')
          
          if (timerNoteInput && timerNoteInput.style.display !== 'none' && timerNoteTitleInput) {
            const title = timerNoteTitleInput.value.trim()
            
            // 保存到独立的单次模式备注字段
            const data = DataStore.getData()
            data.singleModeNote = title
            DataStore.saveImmediate()
            
            // 切换到显示模式
            timerNoteInput.style.display = 'none'
            timerNoteDisplay.style.display = 'flex'
            timerNoteText.textContent = title
            
            // 根据字数调整位置
            const len = title.length
            if (len <= 2) {
              timerNoteDisplay.style.top = '40px'
            } else if (len <= 4) {
              timerNoteDisplay.style.top = '45px'
            } else {
              timerNoteDisplay.style.top = '50px'
            }
          }
        }
      },
      
      onStatusChange: (status) => {
        // 通知主进程更新计时器状态
        if (window.electronAPI && window.electronAPI.updateTimerStatus) {
          const isRunning = status === 'running'
          const isPaused = status === 'paused'
          window.electronAPI.updateTimerStatus(isRunning, isPaused)
        }

        // 暂停时禁用滚轮选择器和预设按钮，恢复时重新启用
        if (status === 'paused') {
          Presets.setEnabled(false)
          WheelPicker.setEnabled(false)
        } else if (status === 'ready') {
          Presets.setEnabled(true)
          WheelPicker.setEnabled(true)
        }

        if (AppState.appMode === 'single') {
          const mode = Mode.getMode()
          if (status === 'running') {
            DOM.statusEl.textContent = mode === 'work' ? '专注中...' : '休息中...'
          } else if (status === 'paused') {
            DOM.statusEl.textContent = '已暂停'
            // 专注模式下暂停时，停止前台检测
            if (AppState.focusModeEnabled && window.ForegroundDetection) {
              window.ForegroundDetection.stopDetection()
            }
          } else if (status === 'ready') {
            DOM.statusEl.textContent = mode === 'work' ? '准备开始专注工作' : '准备休息一下'
          }
        } else if (AppState.appMode === 'plan') {
          if (status === 'running') {
            const currentItem = PlanMode.getCurrentItem()
            if (currentItem) {
              DOM.statusEl.textContent = currentItem.type === 'work' ? '专注中...' : '休息中...'
            }
          } else if (status === 'paused') {
            DOM.statusEl.textContent = '已暂停'
            // 专注模式下暂停时，停止前台检测
            if (AppState.focusModeEnabled && window.ForegroundDetection) {
              window.ForegroundDetection.stopDetection()
            }
          } else if (status === 'ready') {
            DOM.statusEl.textContent = '准备开始计划'
          }
        }
      },
      
      onEnabledChange: (enabled) => {
        Presets.setEnabled(enabled)
        WheelPicker.setEnabled(enabled)
        // 计划模式下禁用添加按钮
        if (AppState.appMode === 'plan') {
          DOM.addWorkBtn.disabled = !enabled
          DOM.addBreakBtn.disabled = !enabled
        }
        // 专注模式下，计时器运行时禁用开始按钮（显示"暂停"时）
        // 计时器停止时（enabled=true），按钮显示"开始"，不禁用
        if (AppState.focusModeEnabled) {
          if (!enabled) {
            // 计时器运行中，显示"暂停"，添加禁用样式
            DOM.startBtn.classList.add('focus-mode-disabled')
          } else {
            // 计时器停止，显示"开始"，移除禁用样式
            DOM.startBtn.classList.remove('focus-mode-disabled')
          }
        }
      },
      
      onComplete: () => {
        if (AppState.appMode === 'single') {
          const mode = Mode.getMode()
          if (mode === 'work') {
            DOM.statusEl.textContent = '🎉 完成！休息一下吧'
            window.electronAPI.showNotification('🍅 番茄钟完成', '恭喜！你完成了一个番茄时间，休息一下吧~')
            
            // 获取当前备注
            const timerNoteText = document.getElementById('timerNoteText')
            const currentNote = timerNoteText && timerNoteText.textContent ? timerNoteText.textContent.trim() : ''
            
            Stats.increment(Math.round(Timer.getTotalTime() / 60), currentNote)
          } else {
            DOM.statusEl.textContent = '⏰ 休息结束！继续加油'
            window.electronAPI.showNotification('☕ 休息结束', '休息时间到，准备好继续工作了吗？')
          }
        } else if (AppState.appMode === 'plan') {
          // 计划模式：完成当前项，进入下一项
          const currentItem = PlanMode.getCurrentItem()
          if (currentItem && currentItem.type === 'work') {
            // 获取计划模式的备注
            const planNote = window.NoteManager ? window.NoteManager.getNote() : { title: '', detail: '' }
            const noteText = planNote.title || planNote.detail || ''
            
            Stats.increment(currentItem.minutes, noteText)
          }
          
          const nextItem = PlanMode.nextItem()
          if (nextItem) {
            // 还有下一项
            const typeText = nextItem.type === 'work' ? '工作' : '休息'
            window.electronAPI.showNotification(
              '⏰ 进入下一段',
              `${typeText} ${nextItem.minutes} 分钟`
            )
            Timer.setTime(nextItem.minutes)
            WheelPicker.setValue(nextItem.minutes)
            
            // 改变右侧主区域颜色
            AppState.updateContainerColor(nextItem.type === 'break')
            
            // 自动开始下一段
            setTimeout(() => {
              Timer.start()
            }, 1000)
          } else {
            // 计划全部完成
            DOM.statusEl.textContent = '🎉 计划全部完成！'
            window.electronAPI.showNotification('🎉 计划完成', '恭喜！你完成了今天的所有计划！')
            PlanMode.stopPlan()
          }
        }
      }
    }
  }

  /**
   * 获取模式切换回调
   */
  function getModeCallbacks() {
    return {
      onBeforeChange: () => {
        // 如果计时器正在运行，不允许切换模式
        return !Timer.getIsRunning()
      },
      onModeChange: (mode) => {
        // 切换模式时重置计时器
        const defaultTime = mode === 'work' ? AppState.defaultWorkTime : AppState.defaultBreakTime
        Timer.setTime(defaultTime)
        Timer.reset()
        
        // 切换预设列表
        Presets.setMode(mode)
        WheelPicker.setValue(defaultTime)
        
        // 在单次模式下，切换工作/休息模式时自动选择该模式的第一个预设
        if (AppState.appMode === 'single' && window.Presets) {
          const presets = DataStore.getPresets()
          if (presets[mode] && presets[mode].length > 0) {
            // 优先选择25分钟预设
            let selectedIndex = presets[mode].findIndex(preset => {
              const presetMinutes = typeof preset === 'number' ? preset : preset.minutes
              return presetMinutes === 25
            })
            
            // 如果没有25分钟预设，选择第一个
            if (selectedIndex < 0) {
              selectedIndex = 0
            }
            
            const selectedPreset = presets[mode][selectedIndex]
            const selectedMinutes = typeof selectedPreset === 'number' ? selectedPreset : selectedPreset.minutes
            const selectedNote = typeof selectedPreset === 'object' ? selectedPreset.note : null
            
            window.Presets.selectPreset(selectedMinutes, selectedNote, selectedIndex)
            // 绑定备注编辑按钮的点击事件
            if (window.Presets.initializeNoteEditButton) {
              window.Presets.initializeNoteEditButton()
            }
          }
        }
      }
    }
  }

  /**
   * 获取预设选择回调
   */
  function getPresetCallbacks() {
    return {
      onSelect: (minutes) => {
        if (AppState.appMode === 'single') {
          Timer.setTime(minutes)
        }
      }
    }
  }

  /**
   * 获取计划模式回调
   */
  function getPlanModeCallbacks() {
    return {
      onFirstItemChange: (item) => {
        if (AppState.appMode === 'plan' && item) {
          // 只改变右侧主区域颜色（侧边栏保持不变）
          AppState.updateContainerColor(item.type === 'break')
        }
      },
      onTimeUpdate: (minutes) => {
        if (AppState.appMode === 'plan') {
          Timer.setTime(minutes)
          WheelPicker.setValue(minutes)
        }
      }
    }
  }

  // 导出到全局
  window.Callbacks = {
    getTimerCallbacks,
    getModeCallbacks,
    getPresetCallbacks,
    getPlanModeCallbacks
  }
})()
