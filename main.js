/**
 * 番茄钟 - 主进程
 */

const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const musicProcess = require('./src/modules/musicProcess')
const aiAssistant = require('./src/modules/aiAssistant')
const foregroundInspection = require('./src/modules/foregroundInspection')
const { createClient } = require('@supabase/supabase-js')

// Supabase 配置
const SUPABASE_URL = 'https://sjexeynibnfqxvwehnxk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NtzlEhTWwC4qpSY0DEvQ0Q_ER6yJoTz'

let supabase = null
let currentSession = null

// 密码哈希函数
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex')
  }
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return { hash, salt }
}

// 验证密码
function verifyPassword(password, hash, salt) {
  const result = hashPassword(password, salt)
  return result.hash === hash
}

// 初始化 Supabase
function initSupabase() {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log('[Supabase] 客户端已初始化')
}

// 专注模式和计时器状态（供菜园子窗口查询）
let focusModeEnabled = false
let timerRunning = false
let timerPaused = false

// 前台检测就绪状态（供渲染进程查询）
let foregroundInspectionReady = false

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
    apiKey: null, // DeepSeek API Key
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

  // 先显示加载页面
  win.loadFile('src/loading.html')
  
  // 追踪两个 Python 进程的启动状态
  let musicReady = false
  let foregroundReady = false
  let mainPageLoaded = false  // 主页面是否已加载
  
  // 缓存需要在主页面加载后发送的事件
  const pendingEvents = []
  
  // 发送事件到渲染进程（主页面加载后立即发送，否则缓存）
  function sendToRenderer(channel, data) {
    if (mainPageLoaded) {
      win.webContents.send(channel, data)
    } else {
      pendingEvents.push({ channel, data })
    }
  }
  
  // 主页面加载完成后发送缓存的事件
  win.webContents.on('did-finish-load', () => {
    // 检查当前加载的是否是主页面
    const url = win.webContents.getURL()
    if (url.includes('index.html')) {
      mainPageLoaded = true
      // 发送缓存的事件
      pendingEvents.forEach(event => {
        win.webContents.send(event.channel, event.data)
      })
      pendingEvents.length = 0
    }
  })
  
  // 更新加载进度
  function updateLoadingProgress() {
    const progress = ((musicReady ? 50 : 0) + (foregroundReady ? 50 : 0))
    win.webContents.executeJavaScript(`
      document.getElementById('progressBar').style.width = '${progress}%';
      document.getElementById('status').textContent = '${musicReady && foregroundReady ? '启动完成' : '正在启动...'}';
    `)
    
    // 两个进程都 ready 后，加载主页面
    if (musicReady && foregroundReady) {
      setTimeout(() => {
        win.loadFile('src/index.html')
      }, 300)
    }
  }
  
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
  
  // API Key 现在从云端获取，启动时不再自动加载
  // 用户需要先登录，admin 用户才能获取 API Key
  console.log('[Main] 等待用户登录...')
  
  musicProcess.start(musicExePath, savedDeviceId)
  
  // 设置音乐进程回调，转发到渲染进程
  musicProcess.onReady((data) => {
    musicReady = true
    updateLoadingProgress()
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
    sendToRenderer('music-no-music', data)
  })
  
  musicProcess.onPlayError((data) => {
    win.webContents.send('music-play-error', data)
  })
  
  musicProcess.onVolumeChange((data) => {
    win.webContents.send('music-volume-change', data)
  })
  
  // 启动前台检测进程
  let foregroundExePath
  if (app.isPackaged) {
    foregroundExePath = path.join(process.resourcesPath, 'foreground_inspection.exe')
  } else {
    foregroundExePath = path.join(__dirname, 'foreground_inspection', 'foreground_inspection.exe')
  }
  
  // 启动前台检测，不传入 API Key（等待用户登录后设置）
  foregroundInspection.start(foregroundExePath, null)
  
  // 设置前台检测回调，转发到渲染进程
  foregroundInspection.onReady((data) => {
    foregroundReady = true
    foregroundInspectionReady = true  // 标记前台检测已就绪
    updateLoadingProgress()
    // 使用 sendToRenderer 而不是 win.webContents.send，确保事件被缓存
    sendToRenderer('foreground-ready', data)
  })
  
  foregroundInspection.onApiKeyInvalid((data) => {
    sendToRenderer('foreground-api-key-invalid', data)
  })
  
  foregroundInspection.onEntertainmentDetected((data) => {
    sendToRenderer('foreground-entertainment-detected', data)
  })
  
  foregroundInspection.onStatus((data) => {
    win.webContents.send('foreground-status', data)
  })
  
  foregroundInspection.onError((data) => {
    win.webContents.send('foreground-error', data)
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

// 刷新菜园子窗口
ipcMain.on('refresh-garden', () => {
  if (gardenWindow && !gardenWindow.isDestroyed()) {
    gardenWindow.webContents.send('refresh-garden')
  }
})

// 更新专注模式状态
ipcMain.on('update-focus-mode', (event, enabled) => {
  focusModeEnabled = enabled
})

// 更新计时器状态
ipcMain.on('update-timer-status', (event, running, paused) => {
  timerRunning = running
  timerPaused = paused
})

// 查询专注模式和计时器状态（供菜园子窗口调用）
ipcMain.handle('get-timer-state', () => {
  return {
    focusModeEnabled: focusModeEnabled,
    timerRunning: timerRunning,
    timerPaused: timerPaused
  }
})

// ============ 数据存储 IPC 处理 ============

ipcMain.handle('read-data', () => {
  return readData()
})

ipcMain.handle('write-data', (event, data) => {
  return writeData(data)
})

// ============ 凭据存储 IPC 处理 ============

// 凭据文件路径
function getCredentialsPath() {
  return path.join(app.getPath('userData'), 'credentials.json')
}

// 保存凭据
ipcMain.handle('save-credentials', (event, credentials) => {
  try {
    const credentialsPath = getCredentialsPath()
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    console.error('[Credentials] 保存失败:', err)
    return { success: false, error: err.message }
  }
})

// 加载凭据
ipcMain.handle('load-credentials', () => {
  try {
    const credentialsPath = getCredentialsPath()
    if (fs.existsSync(credentialsPath)) {
      const data = fs.readFileSync(credentialsPath, 'utf-8')
      return { success: true, credentials: JSON.parse(data) }
    }
    return { success: true, credentials: null }
  } catch (err) {
    console.error('[Credentials] 加载失败:', err)
    return { success: false, error: err.message }
  }
})

// 清除凭据
ipcMain.handle('clear-credentials', () => {
  try {
    const credentialsPath = getCredentialsPath()
    if (fs.existsSync(credentialsPath)) {
      fs.unlinkSync(credentialsPath)
    }
    return { success: true }
  } catch (err) {
    console.error('[Credentials] 清除失败:', err)
    return { success: false, error: err.message }
  }
})

// ============ 云端登录 IPC 处理 ============

// 测试云端连接
ipcMain.handle('cloud-test-connection', async () => {
  if (!supabase) {
    return { success: false, error: 'Supabase 未初始化' }
  }

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// 获取当前会话
ipcMain.handle('cloud-get-session', async () => {
  if (!currentSession) {
    return { success: true, session: null, deepseekKey: null }
  }
  
  // 如果是 admin，重新获取 DeepSeek API Key
  let deepseekKey = null
  if (currentSession.admin && supabase) {
    try {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('name', 'deepseek')
        .limit(1)

      if (keyData && keyData.length > 0) {
        deepseekKey = keyData[0].api_key
        // 只更新 AI 助手的 API Key（前台检测在专注模式启动时设置）
        aiAssistant.setApiKey(deepseekKey)
      }
    } catch (err) {
      console.error('[Supabase] 获取 API Key 失败:', err)
    }
  }
  
  return { success: true, session: currentSession, deepseekKey: deepseekKey }
})

// 登录
ipcMain.handle('cloud-login', async (event, { username, password }) => {
  if (!supabase) {
    return { success: false, error: 'Supabase 未初始化' }
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)

    if (error) {
      return { success: false, error: '登录失败' }
    }

    if (!users || users.length === 0) {
      return { success: false, error: '用户名不存在' }
    }

    const user = users[0]

    if (!verifyPassword(password, user.password_hash, user.salt)) {
      return { success: false, error: '密码错误' }
    }

    // 更新最后登录时间
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // 创建会话
    currentSession = {
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      admin: user.admin || false
    }

    // 如果是 admin，获取 DeepSeek API Key
    let deepseekKey = null
    if (user.admin) {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('name', 'deepseek')
        .limit(1)

      if (keyData && keyData.length > 0) {
        deepseekKey = keyData[0].api_key
        // 只更新 AI 助手的 API Key（前台检测在专注模式启动时设置）
        aiAssistant.setApiKey(deepseekKey)
        console.log('[Supabase] Admin 用户登录，已获取 DeepSeek API Key（仅内存）')
      }
    }

    console.log('[Supabase] 登录成功:', username, user.admin ? '(Admin)' : '')
    return { 
      success: true, 
      user: currentSession,
      deepseekKey: deepseekKey 
    }
  } catch (err) {
    console.error('[Supabase] 登录异常:', err)
    return { success: false, error: err.message }
  }
})

// 注册
ipcMain.handle('cloud-register', async (event, { username, password }) => {
  if (!supabase) {
    return { success: false, error: 'Supabase 未初始化' }
  }

  if (!username || username.length < 2) {
    return { success: false, error: '用户名至少需要2个字符' }
  }

  if (!password || password.length < 6) {
    return { success: false, error: '密码至少需要6个字符' }
  }

  try {
    // 检查用户名是否已存在
    const { data: existingUsers } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: '用户名已存在' }
    }

    // 哈希密码
    const { hash, salt } = hashPassword(password)

    // 插入用户
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: username,
          password_hash: hash,
          salt: salt,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: '用户名已存在' }
      }
      return { success: false, error: error.message }
    }

    console.log('[Supabase] 注册成功:', username)
    return { success: true, data: data[0] }
  } catch (err) {
    console.error('[Supabase] 注册异常:', err)
    return { success: false, error: err.message }
  }
})

// 退出登录
ipcMain.handle('cloud-logout', async () => {
  currentSession = null
  // 清除 AI 助手的 API Key
  aiAssistant.setApiKey(null)
  // 清除前台检测的 API Key（发送空值）
  foregroundInspection.setApiKey(null)
  console.log('[Supabase] 已退出登录，已清除内存中的 API Key')
  return { success: true }
})

// ============ API Key 管理 IPC 处理（保留兼容） ============

ipcMain.handle('get-api-key', () => {
  // 优先从会话获取（admin 用户）
  if (currentSession && currentSession.admin) {
    // 需要重新获取 API Key
    return null // 暂时返回 null，由前端处理
  }
  const data = readData()
  return data.apiKey || null
})

ipcMain.handle('save-api-key', (event, apiKey) => {
  const data = readData()
  data.apiKey = apiKey
  const success = writeData(data)
  
  if (success) {
    aiAssistant.setApiKey(apiKey)
    foregroundInspection.setApiKey(apiKey)
  }
  
  return success
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

// ============ 前台检测 IPC 处理 ============

// 查询前台检测是否就绪
ipcMain.handle('foreground-is-ready', () => {
  return foregroundInspectionReady
})

ipcMain.on('foreground-start', () => {
  foregroundInspection.startDetection()
})

ipcMain.on('foreground-stop', () => {
  foregroundInspection.stopDetection()
})

ipcMain.on('foreground-get-status', () => {
  foregroundInspection.getStatus()
})

ipcMain.on('foreground-set-api-key', (event, apiKey) => {
  foregroundInspection.setApiKey(apiKey)
})

ipcMain.on('foreground-add-whitelist', (event, keyword) => {
  foregroundInspection.addWhitelist(keyword)
})

ipcMain.on('foreground-add-blacklist', (event, keyword) => {
  foregroundInspection.addBlacklist(keyword)
})

ipcMain.on('foreground-mark-history-not', (event, windowTitle) => {
  foregroundInspection.markHistoryNot(windowTitle)
})

ipcMain.on('foreground-move-blacklist-to-whitelist', (event, keyword) => {
  foregroundInspection.moveBlacklistToWhitelist(keyword)
})

// ============ 窗口置顶 IPC 处理 ============

ipcMain.on('set-always-on-top', (event, onTop) => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.setAlwaysOnTop(onTop)
  }
})

// ============ 窗口抢占前台 IPC 处理 ============

ipcMain.on('bring-to-front', (event) => {
  // 获取主窗口（番茄钟窗口）
  const windows = BrowserWindow.getAllWindows()
  const mainWindow = windows.find(w => !w.isDestroyed())
  
  if (mainWindow) {
    // 先设置置顶，确保能抢占前台
    mainWindow.setAlwaysOnTop(true)
    // 显示窗口（如果被最小化）
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    // 抢占前台焦点
    mainWindow.focus()
    // 移动到最上层
    mainWindow.moveTop()
  }
})

ipcMain.on('cancel-always-on-top', (event) => {
  const windows = BrowserWindow.getAllWindows()
  const mainWindow = windows.find(w => !w.isDestroyed())
  
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(false)
  }
})

app.whenReady().then(() => {
  // 初始化 Supabase
  initSupabase()
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
  // 停止前台检测进程
  foregroundInspection.stop()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // 确保在退出前停止音乐播放器进程
  musicProcess.stop()
  // 确保在退出前停止前台检测进程
  foregroundInspection.stop()
})
