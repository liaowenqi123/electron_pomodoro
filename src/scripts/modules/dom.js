/**
 * 番茄钟 - DOM 元素引用
 */
;(function() {
  'use strict'

  const elements = {
    // 容器
    container: document.querySelector('.container'),
    windowFrame: document.querySelector('.window-frame'),
    
    // 计时器
    timeDisplay: document.getElementById('timeDisplay'),
    startBtn: document.getElementById('startBtn'),
    statusEl: document.getElementById('status'),
    progressCircle: document.getElementById('progressCircle'),
    
    // 统计
    todayCountEl: document.getElementById('todayCount'),
    totalMinutesEl: document.getElementById('totalMinutes'),
    
    // 工作/休息模式按钮
    modeBtns: document.querySelectorAll('.mode-btn'),
    
    // 预设列表
    presetList: document.getElementById('presetList'),
    wheelPickerEl: document.getElementById('wheelPicker'),
    wheelColumn: document.getElementById('wheelColumn'),
    addPresetBtn: document.getElementById('addPresetBtn'),
    
    // 应用模式切换滑块
    modeSlider: document.getElementById('modeSlider'),
    modeSliderThumb: document.getElementById('modeSliderThumb'),
    modeLabels: document.querySelectorAll('.mode-label'),
    
    // 单次/计划模式内容
    singleModeContent: document.getElementById('singleModeContent'),
    planModeContent: document.getElementById('planModeContent'),
    planList: document.getElementById('planList'),
    planAddButtons: document.getElementById('planAddButtons'),
    addWorkBtn: document.getElementById('addWorkBtn'),
    addBreakBtn: document.getElementById('addBreakBtn'),
    
    // 教程弹窗
    tutorialBtn: document.getElementById('tutorialBtn'),
    tutorialModal: document.getElementById('tutorialModal'),
    tutorialClose: document.getElementById('tutorialClose'),
    
    // 音乐播放器
    playBtn: document.getElementById('playBtn'),
    nextBtn: document.getElementById('nextBtn'),
    prevBtn: document.getElementById('prevBtn'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    progressHandle: document.getElementById('progressHandle'),
    trackNameEl: document.getElementById('trackName'),
    currentTimeEl: document.getElementById('currentTime'),
    durationEl: document.getElementById('duration'),
    musicPlayer: document.getElementById('musicPlayer'),
    
    // 按钮
    btnClose: document.querySelector('.btn-close'),
    btnMinimize: document.querySelector('.btn-minimize'),
    btnReset: document.querySelector('.btn-reset')
  }

  // 导出到全局
  window.DOM = elements
})()
