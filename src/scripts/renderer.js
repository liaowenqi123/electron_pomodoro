/**
 * 番茄钟 - 渲染进程主入口
 * 负责初始化和协调各模块
 */
;(async function() {
  'use strict'

  // ============ DOM 元素引用 ============
  const elements = {
    container: document.querySelector('.container'),
    timeDisplay: document.getElementById('timeDisplay'),
    startBtn: document.getElementById('startBtn'),
    statusEl: document.getElementById('status'),
    progressCircle: document.getElementById('progressCircle'),
    todayCountEl: document.getElementById('todayCount'),
    totalMinutesEl: document.getElementById('totalMinutes'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    presetList: document.getElementById('presetList'),
    wheelPickerEl: document.getElementById('wheelPicker'),
    wheelColumn: document.getElementById('wheelColumn'),
    addPresetBtn: document.getElementById('addPresetBtn')
  }

  // ============ 应用状态 ============
  const AppState = {
    defaultWorkTime: 25,
    defaultBreakTime: 5
  }

  // ============ 先加载数据 ============
  await DataStore.load()

  // ============ 初始化统计模块 ============
  Stats.init({
    todayCount: elements.todayCountEl,
    totalMinutes: elements.totalMinutesEl
  })

  // ============ 初始化滚轮选择器 ============
  WheelPicker.init(elements.wheelPickerEl, elements.wheelColumn, null)

  // ============ 初始化预设模块 ============
  await Presets.init(
    {
      presetList: elements.presetList,
      wheelPickerEl: elements.wheelPickerEl,
      addPresetBtn: elements.addPresetBtn
    },
    {
      onSelect: (minutes) => {
        Timer.setTime(minutes)
      }
    }
  )

  // ============ 设置滚轮选择器回调 ============
  WheelPicker.setChangeCallback((value) => {
    // 滚轮值变化时的处理
  })

  // ============ 添加预设按钮事件 ============
  elements.addPresetBtn.addEventListener('click', async () => {
    const minutes = WheelPicker.getValue()
    await Presets.addPreset(minutes)
  })

  // ============ 初始化计时器 ============
  Timer.init(
    {
      timeDisplay: elements.timeDisplay,
      startBtn: elements.startBtn,
      progressCircle: elements.progressCircle
    },
    {
      onStatusChange: (status) => {
        const mode = Mode.getMode()
        if (status === 'running') {
          elements.statusEl.textContent = mode === 'work' ? '专注中...' : '休息中...'
        } else if (status === 'paused') {
          elements.statusEl.textContent = '已暂停'
        } else if (status === 'ready') {
          elements.statusEl.textContent = mode === 'work' ? '准备开始专注工作' : '准备休息一下'
        }
      },
      onEnabledChange: (enabled) => {
        Presets.setEnabled(enabled)
        WheelPicker.setEnabled(enabled)
      },
      onComplete: () => {
        const mode = Mode.getMode()
        if (mode === 'work') {
          elements.statusEl.textContent = '🎉 完成！休息一下吧'
          window.electronAPI.showNotification('🍅 番茄钟完成', '恭喜！你完成了一个番茄时间，休息一下吧~')
          Stats.increment(Math.round(Timer.getTotalTime() / 60))
        } else {
          elements.statusEl.textContent = '⏰ 休息结束！继续加油'
          window.electronAPI.showNotification('☕ 休息结束', '休息时间到，准备好继续工作了吗？')
        }
      }
    }
  )

  // ============ 初始化模式模块 ============
  Mode.init(
    {
      container: elements.container,
      modeBtns: elements.modeBtns
    },
    {
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
  )

  // ============ 重置按钮 ============
  document.querySelector('.btn-reset').addEventListener('click', () => {
    Timer.reset()
  })

  // ============ 关闭窗口按钮 ============
  document.querySelector('.btn-close').addEventListener('click', () => {
    window.electronAPI.closeWindow()
  })

  // ============ 最小化窗口按钮 ============
  document.querySelector('.btn-minimize').addEventListener('click', () => {
    window.electronAPI.minimizeWindow()
  })

  // ============ 教程弹窗 ============
  const tutorialBtn = document.getElementById('tutorialBtn')
  const tutorialModal = document.getElementById('tutorialModal')
  const tutorialClose = document.getElementById('tutorialClose')

  tutorialBtn.addEventListener('click', () => {
    tutorialModal.classList.add('show')
  })

  tutorialClose.addEventListener('click', () => {
    tutorialModal.classList.remove('show')
  })

  // 点击遮罩层关闭
  tutorialModal.addEventListener('click', (e) => {
    if (e.target === tutorialModal) {
      tutorialModal.classList.remove('show')
    }
  })

  // ============ 初始化显示 ============
  Timer.setTime(AppState.defaultWorkTime)
  WheelPicker.setValue(AppState.defaultWorkTime)

  // ============ 初始化音乐播放器 ============
  MusicPlayer.init({
    playBtn: document.getElementById('playBtn'),
    nextBtn: document.getElementById('nextBtn'),
    prevBtn: document.getElementById('prevBtn'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    progressHandle: document.getElementById('progressHandle'),
    trackNameEl: document.getElementById('trackName'),
    currentTimeEl: document.getElementById('currentTime'),
    durationEl: document.getElementById('duration'),
    musicPlayer: document.getElementById('musicPlayer')
  })

})()
