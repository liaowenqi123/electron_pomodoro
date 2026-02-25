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
    deviceList: DOM.deviceList
  })

  // ============ 事件绑定 ============
  
  // 滚轮选择器回调
  WheelPicker.setChangeCallback((value) => {
    // 滚轮值变化时的处理
  })

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

  // 最小化窗口按钮
  DOM.btnMinimize.addEventListener('click', () => {
    window.electronAPI.minimizeWindow()
  })

  // ============ 初始化显示 ============
  Timer.setTime(AppState.defaultWorkTime)
  WheelPicker.setValue(AppState.defaultWorkTime)

  console.log('[App] 初始化完成')
})()
