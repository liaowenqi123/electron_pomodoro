/**
 * 番茄钟 - 应用状态管理
 * 职责：管理应用级别状态，协调模式切换
 */
;(function() {
  'use strict'

  // ============ 状态定义 ============
  const state = {
    defaultWorkTime: 25,
    defaultBreakTime: 5,
    appMode: 'single',  // 'single' | 'plan'
    focusModeEnabled: false  // 专注模式开关
  }

  // ============ 状态管理 API ============
  
  function getAppMode() {
    return state.appMode
  }

  function getDefaultWorkTime() {
    return state.defaultWorkTime
  }

  function getDefaultBreakTime() {
    return state.defaultBreakTime
  }

  /**
   * 获取专注模式状态
   */
  function isFocusModeEnabled() {
    return state.focusModeEnabled
  }

  /**
   * 切换专注模式
   */
  function toggleFocusMode() {
    state.focusModeEnabled = !state.focusModeEnabled
    // 更新 UI 显示
    updateFocusModeUI()
    return state.focusModeEnabled
  }

  /**
   * 设置专注模式
   */
  function setFocusMode(enabled) {
    state.focusModeEnabled = enabled
    updateFocusModeUI()
  }

  /**
   * 更新专注模式 UI
   */
  function updateFocusModeUI() {
    if (DOM.focusModeSwitch) {
      if (state.focusModeEnabled) {
        DOM.focusModeSwitch.classList.add('active')
      } else {
        DOM.focusModeSwitch.classList.remove('active')
      }
    }
    if (DOM.container) {
      if (state.focusModeEnabled) {
        DOM.container.classList.add('focus-mode')
      } else {
        DOM.container.classList.remove('focus-mode')
      }
    }
  }

  // ============ 模式切换逻辑 ============
  
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
    // 更新 UI
    updateModeSliderUI(false)
    updateContentVisibility('single')
    updateModeButtonsVisibility(true)
    
    // 根据当前工作/休息模式恢复颜色
    const currentMode = Mode.getMode()
    updateContainerColor(currentMode === 'break')
    
    // 恢复状态文字
    DOM.statusEl.textContent = currentMode === 'work' ? '准备开始专注工作' : '准备休息一下'
  }

  function switchToPlanMode() {
    // 更新 UI
    updateModeSliderUI(true)
    updateContentVisibility('plan')
    updateModeButtonsVisibility(false)
    
    // 根据计划第一项设置时间
    PlanMode.render()
    const firstItem = PlanMode.getFirstItem()
    if (firstItem) {
      Timer.setTime(firstItem.minutes)
      WheelPicker.setValue(firstItem.minutes)
      updateContainerColor(firstItem.type === 'break')
    } else {
      Timer.setTime(25)
      WheelPicker.setValue(25)
      updateContainerColor(false)
    }
    
    DOM.statusEl.textContent = '准备开始计划'
  }

  // ============ UI 更新辅助函数 ============
  
  function updateModeSliderUI(isPlanMode) {
    if (isPlanMode) {
      DOM.modeSlider.classList.add('plan-mode')
      DOM.modeLabels[0].classList.remove('active')
      DOM.modeLabels[1].classList.add('active')
      DOM.container.classList.add('plan-mode')
      DOM.windowFrame.classList.add('plan-mode')
    } else {
      DOM.modeSlider.classList.remove('plan-mode')
      DOM.modeLabels[0].classList.add('active')
      DOM.modeLabels[1].classList.remove('active')
      DOM.container.classList.remove('plan-mode')
      DOM.windowFrame.classList.remove('plan-mode')
    }
  }

  function updateContentVisibility(mode) {
    if (mode === 'single') {
      DOM.singleModeContent.style.display = 'block'
      DOM.planModeContent.style.display = 'none'
      DOM.addPresetBtn.style.display = 'flex'
      DOM.planAddButtons.style.display = 'none'
    } else {
      DOM.singleModeContent.style.display = 'none'
      DOM.planModeContent.style.display = 'block'
      DOM.addPresetBtn.style.display = 'none'
      DOM.planAddButtons.style.display = 'flex'
    }
  }

  function updateModeButtonsVisibility(visible) {
    DOM.modeBtns.forEach(btn => btn.style.display = visible ? 'flex' : 'none')
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
    get focusModeEnabled() { return state.focusModeEnabled },
    getAppMode,
    getDefaultWorkTime,
    getDefaultBreakTime,
    switchAppMode,
    updateContainerColor,
    isFocusModeEnabled,
    toggleFocusMode,
    setFocusMode,
    updateFocusModeUI
  }
})()
