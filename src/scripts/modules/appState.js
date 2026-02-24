/**
 * 番茄钟 - 应用状态管理
 */
;(function() {
  'use strict'

  const state = {
    defaultWorkTime: 25,
    defaultBreakTime: 5,
    appMode: 'single'  // 'single' | 'plan'
  }

  /**
   * 切换应用模式（单次/计划）
   */
  function switchAppMode(mode) {
    if (Timer.getIsRunning()) return // 运行中不允许切换
    
    state.appMode = mode
    
    if (mode === 'single') {
      switchToSingleMode()
    } else if (mode === 'plan') {
      switchToPlanMode()
    }
  }

  function switchToSingleMode() {
    DOM.modeSlider.classList.remove('plan-mode')
    DOM.modeLabels[0].classList.add('active')
    DOM.modeLabels[1].classList.remove('active')
    DOM.container.classList.remove('plan-mode')
    DOM.windowFrame.classList.remove('plan-mode')
    
    // 显示单次模式内容
    DOM.singleModeContent.style.display = 'block'
    DOM.planModeContent.style.display = 'none'
    DOM.addPresetBtn.style.display = 'flex'
    DOM.planAddButtons.style.display = 'none'
    
    // 恢复工作/休息模式按钮
    DOM.modeBtns.forEach(btn => btn.style.display = 'flex')
    
    // 根据当前工作/休息模式恢复颜色
    const currentMode = Mode.getMode()
    if (currentMode === 'break') {
      DOM.container.classList.add('break-mode')
      DOM.windowFrame.classList.add('break-mode')
    } else {
      DOM.container.classList.remove('break-mode')
      DOM.windowFrame.classList.remove('break-mode')
    }
    
    // 恢复状态文字
    DOM.statusEl.textContent = currentMode === 'work' ? '准备开始专注工作' : '准备休息一下'
  }

  function switchToPlanMode() {
    DOM.modeSlider.classList.add('plan-mode')
    DOM.modeLabels[0].classList.remove('active')
    DOM.modeLabels[1].classList.add('active')
    DOM.container.classList.add('plan-mode')
    DOM.windowFrame.classList.add('plan-mode')
    
    // 显示计划模式内容
    DOM.singleModeContent.style.display = 'none'
    DOM.planModeContent.style.display = 'block'
    DOM.addPresetBtn.style.display = 'none'
    DOM.planAddButtons.style.display = 'flex'
    
    // 隐藏工作/休息模式按钮
    DOM.modeBtns.forEach(btn => btn.style.display = 'none')
    
    // 根据计划第一项设置时间
    PlanMode.render()
    const firstItem = PlanMode.getFirstItem()
    if (firstItem) {
      Timer.setTime(firstItem.minutes)
      WheelPicker.setValue(firstItem.minutes)
      // 右侧主区域颜色根据第一项类型变化
      if (firstItem.type === 'break') {
        DOM.container.classList.add('break-mode')
        DOM.windowFrame.classList.add('break-mode')
      } else {
        DOM.container.classList.remove('break-mode')
        DOM.windowFrame.classList.remove('break-mode')
      }
    } else {
      Timer.setTime(25)
      WheelPicker.setValue(25)
    }
    
    DOM.statusEl.textContent = '准备开始计划'
  }

  /**
   * 更新容器颜色
   */
  function updateContainerColor(isBreak) {
    if (isBreak) {
      DOM.container.classList.add('break-mode')
      DOM.windowFrame.classList.add('break-mode')
    } else {
      DOM.container.classList.remove('break-mode')
      DOM.windowFrame.classList.remove('break-mode')
    }
  }

  // 导出到全局
  window.AppState = {
    get appMode() { return state.appMode },
    get defaultWorkTime() { return state.defaultWorkTime },
    get defaultBreakTime() { return state.defaultBreakTime },
    switchAppMode,
    updateContainerColor
  }
})()
