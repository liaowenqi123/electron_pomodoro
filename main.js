/**
 * 番茄钟 - 主进程
 */

const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const musicProcess = require('./src/modules/musicProcess')

// Windows控制台设置UTF-8编码
if (process.platform === 'win32') {
  const { execSync } = require('child_process')
  try {
    // 设置控制台代码页为UTF-8 (65001)
    execSync('chcp 65001', { stdio: 'inherit' })
  } catch (e) {
    // 忽略错误
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 780,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('src/index.html')
  
  // 启动音乐播放器进程
  const musicExePath = path.join(__dirname, 'music-player', 'music.exe')
  musicProcess.start(musicExePath)
  
  // 设置音乐进程回调，转发到渲染进程
  musicProcess.onStatus((data) => {
    win.webContents.send('music-status', data)
  })
  
  musicProcess.onTrackChange((data) => {
    win.webContents.send('music-track-change', data)
  })
  
  musicProcess.onPlayState((data) => {
    win.webContents.send('music-play-state', data)
  })
  
  musicProcess.onProgress((data) => {
    win.webContents.send('music-progress', data)
  })
}

// 处理关闭窗口请求
ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.close()
  }
})

// 处理显示通知请求
ipcMain.on('show-notification', (event, data) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: data.title || '番茄钟',
      body: data.body || '',
      silent: false
    })
    notification.show()
  }
})

// ============ 音乐播放器 IPC 处理 ============

ipcMain.on('music-toggle', () => {
  musicProcess.togglePlay()
})

ipcMain.on('music-next', () => {
  musicProcess.next()
})

ipcMain.on('music-prev', () => {
  musicProcess.prev()
})

ipcMain.on('music-seek', (event, position) => {
  musicProcess.seek(position)
})

ipcMain.on('music-set-volume', (event, volume) => {
  musicProcess.setVolume(volume)
})

ipcMain.on('music-get-status', () => {
  musicProcess.getStatus()
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // 停止音乐播放器进程
  musicProcess.stop()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // 确保在退出前停止音乐播放器进程
  musicProcess.stop()
})
