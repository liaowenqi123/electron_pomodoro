/**
 * 预加载脚本 - 安全地暴露 IPC 通信给渲染进程
 */

const { contextBridge, ipcRenderer } = require('electron')

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 关闭窗口
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // 显示通知
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // ============ 音乐播放器控制 ============
  
  // 音乐播放器控制命令
  musicTogglePlay: () => ipcRenderer.send('music-toggle'),
  musicNext: () => ipcRenderer.send('music-next'),
  musicPrev: () => ipcRenderer.send('music-prev'),
  musicSeek: (position) => ipcRenderer.send('music-seek', position),
  musicSetVolume: (volume) => ipcRenderer.send('music-set-volume', volume),
  musicGetStatus: () => ipcRenderer.send('music-get-status'),
  
  // 音乐播放器事件监听
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
  
  // 移除监听器
  removeMusicListeners: () => {
    ipcRenderer.removeAllListeners('music-status')
    ipcRenderer.removeAllListeners('music-track-change')
    ipcRenderer.removeAllListeners('music-play-state')
    ipcRenderer.removeAllListeners('music-progress')
  }
})