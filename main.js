/**
 * 番茄钟 - 主进程
 */

const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const musicProcess = require('./src/modules/musicProcess')

// 数据文件路径
let dataFilePath = null

function getDataFilePath() {
  if (dataFilePath) return dataFilePath
  
  // 数据存放在用户数据目录（可读写）
  // 开发环境和打包后都使用这个路径
  const userDataPath = app.getPath('userData')
  dataFilePath = path.join(userDataPath, 'data', 'data.json')
  return dataFilePath
}

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(getDataFilePath())
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// 默认数据结构
const defaultData = {
  stats: {
    date: new Date().toDateString(),
    todayCount: 0,
    totalMinutes: 0
  },
  presets: {
    work: [15, 25, 45, 60],
    break: [5, 10, 15]
  }
}

// 读取数据
function readData() {
  ensureDataDir()
  const filePath = getDataFilePath()
  
  // 如果文件不存在，创建默认数据
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
    return defaultData
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    console.error('读取数据文件失败:', e)
    return defaultData
  }
}

// 写入数据
function writeData(data) {
  ensureDataDir()
  const filePath = getDataFilePath()
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('写入数据文件失败:', e)
    return false
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 560,
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
  // 开发环境: __dirname/music-player/music.exe
  // 打包后: resources/music-player/music.exe (extraResource会复制到resources目录)
  let musicExePath
  if (app.isPackaged) {
    // 打包后：extraResource会把music-player放到resources目录下
    musicExePath = path.join(process.resourcesPath, 'music-player', 'music.exe')
  } else {
    // 开发环境
    musicExePath = path.join(__dirname, 'music-player', 'music.exe')
  }
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

// 处理最小化窗口请求
ipcMain.on('minimize-window', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.minimize()
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

// ============ 数据存储 IPC 处理 ============

ipcMain.handle('read-data', () => {
  return readData()
})

ipcMain.handle('write-data', (event, data) => {
  return writeData(data)
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
