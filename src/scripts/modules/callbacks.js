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
      },
      
      onStatusChange: (status) => {
        if (AppState.appMode === 'single') {
          const mode = Mode.getMode()
          if (status === 'running') {
            DOM.statusEl.textContent = mode === 'work' ? '专注中...' : '休息中...'
          } else if (status === 'paused') {
            DOM.statusEl.textContent = '已暂停'
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
      },
      
      onComplete: () => {
        if (AppState.appMode === 'single') {
          const mode = Mode.getMode()
          if (mode === 'work') {
            DOM.statusEl.textContent = '🎉 完成！休息一下吧'
            window.electronAPI.showNotification('🍅 番茄钟完成', '恭喜！你完成了一个番茄时间，休息一下吧~')
            Stats.increment(Math.round(Timer.getTotalTime() / 60))
          } else {
            DOM.statusEl.textContent = '⏰ 休息结束！继续加油'
            window.electronAPI.showNotification('☕ 休息结束', '休息时间到，准备好继续工作了吗？')
          }
        } else if (AppState.appMode === 'plan') {
          // 计划模式：完成当前项，进入下一项
          const currentItem = PlanMode.getCurrentItem()
          if (currentItem && currentItem.type === 'work') {
            Stats.increment(currentItem.minutes)
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
