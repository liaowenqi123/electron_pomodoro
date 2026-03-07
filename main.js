/**
 * 番茄钟 - 主进程
 */

const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const musicProcess = require('./src/modules/musicProcess')
const aiAssistant = require('./src/modules/aiAssistant')

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

// 创建默认数据结构（与渲染进程 utils.js 保持一致）
function createDefaultData() {
  return {
    stats: {
      date: new Date().toDateString(),
      todayCount: 0,
      totalMinutes: 0
    },
    presets: {
      work: [15, 25, 45, 60],
      break: [5, 10, 15]
    },
    planList: [],
    audioDevice: null,
    // 菜园子系统
    garden: {
      coins: 0,
      seeds: { carrot: 5, tomato: 2, sunflower: 0, rose: 0, osmanthus: 0 },
      plots: [
        { id: 0, crop: null, progress: 0, plantedAt: null },
        { id: 1, crop: null, progress: 0, plantedAt: null },
        { id: 2, crop: null, progress: 0, plantedAt: null },
        { id: 3, crop: null, progress: 0, plantedAt: null },
        { id: 4, crop: null, progress: 0, plantedAt: null },
        { id: 5, crop: null, progress: 0, plantedAt: null },
        { id: 6, crop: null, progress: 0, plantedAt: null, locked: true },
        { id: 7, crop: null, progress: 0, plantedAt: null, locked: true },
        { id: 8, crop: null, progress: 0, plantedAt: null, locked: true },
        { id: 9, crop: null, progress: 0, plantedAt: null, locked: true },
        { id: 10, crop: null, progress: 0, plantedAt: null, locked: true },
        { id: 11, crop: null, progress: 0, plantedAt: null, locked: true }
      ],
      warehouse: []
    }
  }
}

// 读取数据
function readData() {
  ensureDataDir()
  const filePath = getDataFilePath()
  const defaultData = createDefaultData()
  
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
  // 打包后: resources/music.exe (extraResource会复制到resources目录)
  let musicExePath
  if (app.isPackaged) {
    // 打包后：extraResource会把 music.exe 和 music 文件夹放到 resources 目录下
    musicExePath = path.join(process.resourcesPath, 'music.exe')
  } else {
    // 开发环境
    musicExePath = path.join(__dirname, 'music-player', 'music.exe')
  }
  
  // 读取保存的设备ID
  const savedData = readData()
  const savedDeviceId = savedData.audioDevice
  
  musicProcess.start(musicExePath, savedDeviceId)
  
  // 设置音乐进程回调，转发到渲染进程
  musicProcess.onReady((data) => {
    win.webContents.send('music-ready', data)
  })
  
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
  
  musicProcess.onDevices((data) => {
    win.webContents.send('music-devices', data)
  })
  
  musicProcess.onNoMusic((data) => {
    win.webContents.send('music-no-music', data)
  })
  
  musicProcess.onPlayError((data) => {
    win.webContents.send('music-play-error', data)
  })
}

// 存储菜园子窗口引用
let gardenWindow = null

// 创建菜园子窗口
function createGardenWindow() {
  // 如果窗口已存在，聚焦它
  if (gardenWindow) {
    gardenWindow.focus()
    return
  }

  gardenWindow = new BrowserWindow({
    width: 400,
    height: 520,
    frame: false,
    transparent: true,
    resizable: false,
    parent: BrowserWindow.getFocusedWindow(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  gardenWindow.loadFile('src/garden.html')

  // 窗口关闭时清理引用
  gardenWindow.on('closed', () => {
    gardenWindow = null
  })
}

// 处理关闭窗口请求
ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    // 先停止音乐进程
    musicProcess.stop()
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

// ============ 菜园子窗口 IPC 处理 ============

// 打开菜园子窗口
ipcMain.on('open-garden', () => {
  createGardenWindow()
})

// 关闭菜园子窗口
ipcMain.on('close-garden', () => {
  if (gardenWindow) {
    gardenWindow.close()
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

ipcMain.on('music-get-devices', () => {
  musicProcess.getDevices()
})

ipcMain.on('music-set-device', (event, deviceId) => {
  musicProcess.setDevice(deviceId)
  // 保存设备ID到数据文件
  const data = readData()
  data.audioDevice = deviceId
  writeData(data)
})

// ============ AI助手 IPC 处理 ============

ipcMain.handle('ai-generate-plan', async (event, userInput) => {
  return await aiAssistant.generatePlan(userInput)
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
