/**
 * 番茄钟 - 渲染进程主入口
 * 负责初始化和协调各模块
 */
;(async function() {
  'use strict'

  // ============ 加载数据 ============
  await DataStore.load()

  // ============ 初始化统计模块 ============
  Stats.init({
    todayCount: DOM.todayCountEl,
    totalMinutes: DOM.totalMinutesEl
  })

  // ============ 初始化滚轮选择器 ============
  WheelPicker.init(DOM.wheelPickerEl, DOM.wheelColumn, null)
  
  // ============初始化主题模块============
  if (window.Theme) {
    Theme.init({
      themeToggleBtn: document.getElementById('themeToggleBtn')
    });
  }
  // ============ 初始化预设模块 ============
  await Presets.init(
    {
      presetList: DOM.presetList,
      wheelPickerEl: DOM.wheelPickerEl,
      addPresetBtn: DOM.addPresetBtn
    },
    Callbacks.getPresetCallbacks()
  )

  // ============ 初始化计划模式模块 ============
  PlanMode.init(
    { planList: DOM.planList },
    Callbacks.getPlanModeCallbacks()
  )

  // ============ 初始化计时器 ============
  Timer.init(
    {
      timeDisplay: DOM.timeDisplay,
      startBtn: DOM.startBtn,
      progressCircle: DOM.progressCircle
    },
    Callbacks.getTimerCallbacks()
  )

  // ============ 初始化模式模块 ============
  Mode.init(
    {
      container: DOM.container,
      modeBtns: DOM.modeBtns
    },
    Callbacks.getModeCallbacks()
  )

  // ============ 初始化教程弹窗 ============
  Tutorial.init()

  // ============ 初始化AI助手 ============
  AIHelper.init({
    aiBtn: DOM.aiBtn,
    aiModal: DOM.aiModal,
    aiModalClose: DOM.aiModalClose,
    aiInput: DOM.aiInput,
    aiGenerateBtn: DOM.aiGenerateBtn,
    aiResult: DOM.aiResult,
    aiApplyBtn: DOM.aiApplyBtn
  })

  // ============ 初始化音乐播放器 ============
  MusicPlayer.init({
    playBtn: DOM.playBtn,
    nextBtn: DOM.nextBtn,
    prevBtn: DOM.prevBtn,
    progressBar: DOM.progressBar,
    progressFill: DOM.progressFill,
    progressHandle: DOM.progressHandle,
    trackNameEl: DOM.trackNameEl,
    currentTimeEl: DOM.currentTimeEl,
    durationEl: DOM.durationEl,
    musicPlayer: DOM.musicPlayer,
    deviceBtn: DOM.deviceBtn,
    deviceList: DOM.deviceList,
    volumeBtn: DOM.volumeBtn,
    volumeSlider: DOM.volumeSlider,
    volumeRange: DOM.volumeRange
  })

  // ============ 初始化前台检测模块 ============
  if (window.ForegroundDetection) {
    window.ForegroundDetection.init()
  }

  // ============ 事件绑定 ============
  
  // 滚轮选择器回调
  WheelPicker.setChangeCallback((value) => {
    // 滚轮值变化时的处理
  })

  // 专注模式开关事件
  if (DOM.focusModeSwitch) {
    DOM.focusModeSwitch.addEventListener('click', () => {
      // 番茄钟运行时不允许切换专注模式（已在appState.js中通过pointer-events禁用）
      if (Timer.getIsRunning()) {
        return
      }
      
      AppState.toggleFocusMode()
      
      // 更新状态文字
      if (DOM.focusModeStatus) {
        DOM.focusModeStatus.textContent = AppState.focusModeEnabled ? '开启' : '关闭'
        DOM.focusModeStatus.classList.toggle('active', AppState.focusModeEnabled)
      }
      
      // 更新菜园子按钮状态
      updateGardenButtonState()
      
      // 专注模式关闭时，停止前台检测
      if (!AppState.focusModeEnabled && window.ForegroundDetection) {
        window.ForegroundDetection.stopDetection()
      }
    })
  }

  // 更新菜园子按钮状态（专注模式下番茄钟运行时禁用）
  function updateGardenButtonState() {
    if (DOM.gardenBtn) {
      // 专注模式开启且番茄钟运行时，禁用菜园子按钮
      if (AppState.focusModeEnabled && Timer.getIsRunning()) {
        DOM.gardenBtn.disabled = true
        DOM.gardenBtn.style.opacity = '0.5'
        DOM.gardenBtn.style.cursor = 'not-allowed'
        DOM.gardenBtn.title = '专注模式下番茄钟运行中，无法使用菜园'
      } else {
        DOM.gardenBtn.disabled = false
        DOM.gardenBtn.style.opacity = '1'
        DOM.gardenBtn.style.cursor = 'pointer'
        DOM.gardenBtn.title = ''
      }
    }
  }

  // 添加预设按钮
  DOM.addPresetBtn.addEventListener('click', async () => {
    if (AppState.appMode === 'single') {
      const minutes = WheelPicker.getValue()
      await Presets.addPreset(minutes)
    }
  })

  // 计划模式添加按钮
  DOM.addWorkBtn.addEventListener('click', async () => {
    const minutes = WheelPicker.getValue()
    await PlanMode.addItem(minutes, 'work')
  })

  DOM.addBreakBtn.addEventListener('click', async () => {
    const minutes = WheelPicker.getValue()
    await PlanMode.addItem(minutes, 'break')
  })

  // 应用模式切换滑块
  DOM.modeSlider.addEventListener('click', () => {
    const newMode = AppState.appMode === 'single' ? 'plan' : 'single'
    AppState.switchAppMode(newMode)
  })

  DOM.modeLabels.forEach(label => {
    label.addEventListener('click', () => {
      const mode = label.dataset.mode
      if (mode === 'single') {
        AppState.switchAppMode('single')
      } else if (mode === 'plan') {
        AppState.switchAppMode('plan')
      }
    })
  })

  // 重置按钮
  DOM.btnReset.addEventListener('click', () => {
    // 先保存当前计时器运行状态（在重置之前）
    const wasRunning = Timer.getIsRunning()
    
    // 停止前台检测
    if (window.ForegroundDetection) {
      window.ForegroundDetection.stopDetection()
    }
    
    // 专注模式下，如果计时器正在运行，弹出确认框
    if (AppState.focusModeEnabled && wasRunning) {
      const confirmed = confirm('确定要中断专注吗？所有正在生长的作物将会枯萎！')
      if (!confirmed) {
        return // 用户取消，不执行重置
      }
      // 显示惩罚提示
      DOM.statusEl.textContent = '⚠️ 专注中断！作物已枯萎'
      // 触发惩罚：所有正在生长的作物枯萎
      if (window.Garden) {
        window.Garden.handleResetPunishment()
      }
    }
    
    // 先停止计时器
    Timer.reset()
    
    if (AppState.appMode === 'plan') {
      // 计划模式下，重置 = 停止整个计划，恢复到第一个计划
      PlanMode.stopPlan()
      DOM.statusEl.textContent = '准备开始计划'
      
      // 恢复到第一个计划的时间和颜色
      const firstItem = PlanMode.getFirstItem()
      if (firstItem) {
        Timer.setTime(firstItem.minutes)
        WheelPicker.setValue(firstItem.minutes)
        AppState.updateContainerColor(firstItem.type === 'break')
      }
    }
  })

  // 关闭窗口按钮
  DOM.btnClose.addEventListener('click', () => {
    window.electronAPI.closeWindow()
  })

  // 菜园子按钮事件
  if (DOM.gardenBtn) {
    DOM.gardenBtn.addEventListener('click', () => {
      window.electronAPI.openGarden()
    })
  }

  // 最小化窗口按钮
  DOM.btnMinimize.addEventListener('click', () => {
    window.electronAPI.minimizeWindow()
  })

  // ============ 初始化显示 ============
  Timer.setTime(AppState.defaultWorkTime)
  WheelPicker.setValue(AppState.defaultWorkTime)

  // ============ 顶部按钮展开/收起功能 ============
  const expandBtn = document.getElementById('expandBtn')
  const hiddenButtons = document.getElementById('hiddenButtons')
  let isExpanded = false

  if (expandBtn && hiddenButtons) {
    expandBtn.addEventListener('click', () => {
      isExpanded = !isExpanded
      
      if (isExpanded) {
        // 展开：箭头旋转，容器展开露出按钮
        expandBtn.classList.add('expanded')
        hiddenButtons.classList.add('expanded')
        expandBtn.title = '收起'
      } else {
        // 收起：箭头恢复，容器收起隐藏按钮
        expandBtn.classList.remove('expanded')
        hiddenButtons.classList.remove('expanded')
        expandBtn.title = '展开'
      }
    })
  }

  console.log('[App] 初始化完成')
})()
