/**
 * 预加载脚本 - 安全地暴露 IPC 通信给渲染进程
 */

const { contextBridge, ipcRenderer } = require('electron')

  // 通过 contextBridge 安全地暴露 API 给渲染进程
  contextBridge.exposeInMainWorld('electronAPI', {
  // 关闭窗口
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // 最小化窗口
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  
  // 显示通知
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // ============ 数据存储 API ============
  
  // 读取数据
  readData: () => ipcRenderer.invoke('read-data'),
  
  // 写入数据
  writeData: (data) => ipcRenderer.invoke('write-data', data),

  // ============ 音乐播放器控制 ============
  
  // 音乐播放器控制命令
  musicTogglePlay: () => ipcRenderer.send('music-toggle'),
  musicNext: () => ipcRenderer.send('music-next'),
  musicPrev: () => ipcRenderer.send('music-prev'),
  musicSeek: (position) => ipcRenderer.send('music-seek', position),
  musicSetVolume: (volume) => ipcRenderer.send('music-set-volume', volume),
  musicGetStatus: () => ipcRenderer.send('music-get-status'),
  musicGetDevices: () => ipcRenderer.send('music-get-devices'),
  musicSetDevice: (deviceId) => ipcRenderer.send('music-set-device', deviceId),
  
  // 音乐播放器事件监听
  onMusicReady: (callback) => {
    ipcRenderer.on('music-ready', (event, data) => callback(data))
  },
  onMusicStatus: (callback) => {
    ipcRenderer.on('music-status', (event, data) => callback(data))
  },
  onMusicTrackChange: (callback) => {
    ipcRenderer.on('music-track-change', (event, data) => callback(data))
  },
  onMusicPlayState: (callback) => {
    ipcRenderer.on('music-play-state', (event, data) => callback(data))
  },
  onMusicProgress: (callback) => {
    ipcRenderer.on('music-progress', (event, data) => callback(data))
  },
  onMusicDevices: (callback) => {
    ipcRenderer.on('music-devices', (event, data) => callback(data))
  },
  onMusicNoMusic: (callback) => {
    ipcRenderer.on('music-no-music', (event, data) => callback(data))
  },
  onMusicPlayError: (callback) => {
    ipcRenderer.on('music-play-error', (event, data) => callback(data))
  },
  
  // 移除监听器
  removeMusicListeners: () => {
    ipcRenderer.removeAllListeners('music-ready')
    ipcRenderer.removeAllListeners('music-status')
    ipcRenderer.removeAllListeners('music-track-change')
    ipcRenderer.removeAllListeners('music-play-state')
    ipcRenderer.removeAllListeners('music-progress')
    ipcRenderer.removeAllListeners('music-devices')
    ipcRenderer.removeAllListeners('music-no-music')
    ipcRenderer.removeAllListeners('music-play-error')
  },

  // ============ 菜园子窗口 API ============
  
  // 打开菜园子窗口
  openGarden: () => ipcRenderer.send('open-garden'),
  
  // 关闭菜园子窗口
  closeGarden: () => ipcRenderer.send('close-garden'),
  
  // 刷新菜园子窗口
  refreshGarden: () => ipcRenderer.send('refresh-garden'),
  
  // 监听菜园子刷新事件
  onGardenRefresh: (callback) => {
    ipcRenderer.on('refresh-garden', () => callback())
  },

  // ============ AI助手 API ============
  
  // 生成AI计划
  aiGeneratePlan: (userInput) => ipcRenderer.invoke('ai-generate-plan', userInput)
})
