/**
 * 音乐播放器模块 - 渲染进程
 * 负责音乐播放器的UI交互和状态管理
 */

const MusicPlayer = (function() {
  'use strict'

  // ============ 状态 ============
  let state = {
    playing: false,
    trackName: '',
    currentTime: 0,
    duration: 0,
    isDragging: false,
    lastSyncTime: 0,  // 上次同步的时间戳
    devices: [],
    currentDeviceId: null,
    isDeviceListOpen: false
  }

  // ============ DOM 元素引用 ============
  let elements = {
    playBtn: null,
    nextBtn: null,
    prevBtn: null,
    progressBar: null,
    progressFill: null,
    progressHandle: null,
    trackNameEl: null,
    currentTimeEl: null,
    durationEl: null,
    musicPlayer: null,
    deviceBtn: null,
    deviceList: null
  }

  // ============ 工具函数 ============
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function updateProgressUI() {
    if (state.duration <= 0) return
    
    const progress = (state.currentTime / state.duration) * 100
    if (elements.progressFill) {
      elements.progressFill.style.width = `${progress}%`
    }
    // 更新豆子位置
    if (elements.progressHandle) {
      elements.progressHandle.style.left = `${progress}%`
    }
    if (elements.currentTimeEl) {
      elements.currentTimeEl.textContent = formatTime(state.currentTime)
    }
    if (elements.durationEl) {
      elements.durationEl.textContent = formatTime(state.duration)
    }
    if (elements.trackNameEl) {
      elements.trackNameEl.textContent = state.trackName || '未播放'
    }
  }

  function updatePlayButton() {
    if (elements.playBtn) {
      elements.playBtn.textContent = state.playing ? '⏸' : '▶'
      elements.playBtn.setAttribute('data-playing', state.playing)
    }
  }

  // ============ 进度条交互 ============
  
  function handleProgressClick(e) {
    if (!elements.progressBar || state.duration <= 0) return
    
    const rect = elements.progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const progress = clickX / rect.width
    const newTime = Math.floor(progress * state.duration)
    
    window.electronAPI.musicSeek(newTime)
  }

  function handleProgressDragStart(e) {
    state.isDragging = true
    document.addEventListener('mousemove', handleProgressDrag)
    document.addEventListener('mouseup', handleProgressDragEnd)
  }

  function handleProgressDrag(e) {
    if (!state.isDragging || !elements.progressBar || state.duration <= 0) return
    
    const rect = elements.progressBar.getBoundingClientRect()
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const progress = clickX / rect.width
    const newTime = Math.floor(progress * state.duration)
    
    // 实时更新UI但不发送命令
    state.currentTime = newTime
    updateProgressUI()
  }

  function handleProgressDragEnd(e) {
    if (!state.isDragging) return
    
    state.isDragging = false
    document.removeEventListener('mousemove', handleProgressDrag)
    document.removeEventListener('mouseup', handleProgressDragEnd)
    
    // 拖拽结束时发送seek命令
    window.electronAPI.musicSeek(state.currentTime)
  }

  // ============ 设备选择器 ============
  
  function renderDeviceList() {
    if (!elements.deviceList) return
    
    if (state.devices.length === 0) {
      elements.deviceList.innerHTML = '<div class="device-item device-empty">加载中...</div>'
      return
    }
    
    const html = state.devices.map(device => {
      const isCurrent = device.id === state.currentDeviceId
      const isDefault = device.is_default
      const classes = ['device-item']
      if (isCurrent) classes.push('device-current')
      if (isDefault) classes.push('device-default')
      
      return `<div class="${classes.join(' ')}" data-device-id="${device.id}">
        <span class="device-name">${device.name}</span>
        <span class="device-api">${device.hostapi}</span>
        ${isCurrent ? '<span class="device-check">✓</span>' : ''}
      </div>`
    }).join('')
    
    elements.deviceList.innerHTML = html
  }
  
  function toggleDeviceList() {
    state.isDeviceListOpen = !state.isDeviceListOpen
    if (state.isDeviceListOpen) {
      elements.deviceList.classList.add('open')
      // 刷新设备列表
      window.electronAPI.musicGetDevices()
    } else {
      elements.deviceList.classList.remove('open')
    }
  }
  
  function handleDeviceClick(e) {
    const deviceItem = e.target.closest('.device-item')
    if (!deviceItem) return
    
    const deviceId = parseInt(deviceItem.dataset.deviceId, 10)
    if (deviceId === state.currentDeviceId) {
      toggleDeviceList()
      return
    }
    
    window.electronAPI.musicSetDevice(deviceId)
    state.currentDeviceId = deviceId
    toggleDeviceList()
  }
  
  function closeDeviceListOnClickOutside(e) {
    if (state.isDeviceListOpen && elements.deviceBtn && elements.deviceList) {
      if (!elements.deviceBtn.contains(e.target) && !elements.deviceList.contains(e.target)) {
        state.isDeviceListOpen = false
        elements.deviceList.classList.remove('open')
      }
    }
  }

  // ============ 事件监听器 ============
  
  function setupEventListeners() {
    // 播放/暂停按钮
    if (elements.playBtn) {
      elements.playBtn.addEventListener('click', () => {
        console.log('[MusicPlayer] playBtn clicked at', Date.now())
        window.electronAPI.musicTogglePlay()
      })
    }

    // 下一首按钮
    if (elements.nextBtn) {
      elements.nextBtn.addEventListener('click', () => {
        window.electronAPI.musicNext()
      })
    }

    // 上一首按钮
    if (elements.prevBtn) {
      elements.prevBtn.addEventListener('click', () => {
        window.electronAPI.musicPrev()
      })
    }

    // 进度条点击
    if (elements.progressBar) {
      elements.progressBar.addEventListener('click', handleProgressClick)
      
      // 进度条拖拽
      if (elements.progressHandle) {
        elements.progressHandle.addEventListener('mousedown', handleProgressDragStart)
      }
    }
    
    // 设备选择按钮
    if (elements.deviceBtn) {
      elements.deviceBtn.addEventListener('click', toggleDeviceList)
    }
    
    // 设备列表点击
    if (elements.deviceList) {
      elements.deviceList.addEventListener('click', handleDeviceClick)
    }
    
    // 点击外部关闭设备列表
    document.addEventListener('click', closeDeviceListOnClickOutside)
  }

  function setupIPCListeners() {
    // 监听准备就绪事件
    window.electronAPI.onMusicReady((data) => {
      state.trackName = data.name
      state.duration = data.duration
      state.currentTime = 0
      state.playing = false
      updateProgressUI()
      updatePlayButton()
      console.log('[MusicPlayer] 收到 ready 事件:', data)
    })

    // 监听状态更新
    window.electronAPI.onMusicStatus((data) => {
      state.playing = data.playing
      state.trackName = data.name
      state.currentTime = data.current
      state.duration = data.duration
      updateProgressUI()
      updatePlayButton()
    })

    // 监听曲目切换
    window.electronAPI.onMusicTrackChange((data) => {
      state.trackName = data.name
      state.duration = data.duration
      state.currentTime = 0
      updateProgressUI()
    })

    // 监听播放状态
    window.electronAPI.onMusicPlayState((data) => {
      state.playing = data.playing
      updatePlayButton()
    })

    // 监听进度更新
    window.electronAPI.onMusicProgress((data) => {
      if (!state.isDragging) {
        state.currentTime = data.current
        state.duration = data.duration
        updateProgressUI()
      }
    })
    
    // 监听设备列表更新
    window.electronAPI.onMusicDevices((data) => {
      state.devices = data.devices || []
      state.currentDeviceId = data.current
      renderDeviceList()
    })
  }

  // ============ 公共API ============
  
  return {
    /**
     * 初始化音乐播放器
     * @param {object} els - DOM元素引用
     */
    init(els) {
      elements = { ...elements, ...els }
      
      setupEventListeners()
      setupIPCListeners()
      
      // 请求初始状态
      window.electronAPI.musicGetStatus()
      // 请求设备列表
      window.electronAPI.musicGetDevices()
      
      console.log('[MusicPlayer] 已初始化')
    },

    /**
     * 获取当前状态
     */
    getState() {
      return { ...state }
    },

    /**
     * 切换播放/暂停
     */
    togglePlay() {
      window.electronAPI.musicTogglePlay()
    },

    /**
     * 下一首
     */
    next() {
      window.electronAPI.musicNext()
    },

    /**
     * 上一首
     */
    prev() {
      window.electronAPI.musicPrev()
    }
  }
})()

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MusicPlayer
}
