# 🍅 番茄钟 (Pomodoro Timer)

一个基于 Electron 的桌面番茄钟应用，帮助你专注工作和休息。

## ✨ 功能特性

- ⏱️ **番茄计时** - 工作/休息模式切换
- 📋 **时间预设管理** - 自定义时间预设，支持添加和删除
- 🎚️ **滚筒式时间选择器** - 直观的时间设置
- 📝 **番茄计划模式** - 创建工作/休息计划列表，支持拖拽排序，自动依次执行
- 🔄 **模式切换** - 单次计时/计划模式自由切换
- 🎵 **音乐播放器** - 边工作边听音乐
- 📊 **统计数据** - 记录今日完成数和累计专注时间（自动持久化存储）
- 🔔 **系统通知** - 计时完成提醒
- 📖 **使用教程** - 内置应用使用说明
- ➖ **窗口最小化** - 支持最小化到任务栏

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.x
- **npm** >= 8.x

### 安装与运行

```bash
# 1. 克隆仓库（首次）
git clone https://github.com/liaowenqi123/electron_pomodoro.git

# 或更新仓库（已克隆过）
git pull

# 2. 进入项目目录
cd electron_pomodoro

# 3. 安装依赖
npm install

# 4. 添加音乐文件（建议）
# 在 music-player 文件夹下创建 music 文件夹，并放入音频文件
# 支持 .wav, .mp3, .flac, .ogg, .m4a 格式
# 不添加音乐文件则音乐播放器功能不完整

# 5. 启动应用
npm start
```

## 📁 项目结构

```
electron_pomodoro/
├── main.js                 # Electron 主进程
├── preload.js              # 预加载脚本 (IPC 通信)
├── package.json            # 项目配置
├── src/
│   ├── index.html          # 页面入口
│   ├── styles/
│   │   ├── base.css            # 基础样式
│   │   ├── sidebar.css         # 侧边栏样式
│   │   ├── main-content.css    # 主内容区样式
│   │   ├── music-player.css    # 音乐播放器样式
│   │   ├── modal.css           # 弹窗样式
│   │   └── modes.css           # 模式样式
│   ├── scripts/
│   │   ├── renderer.js         # 渲染进程入口
│   │   └── modules/            # 功能模块
│   │       ├── timer.js            # 计时器
│   │       ├── wheelPicker.js      # 滚筒选择器
│   │       ├── stats.js            # 统计模块
│   │       ├── mode.js             # 模式切换（工作/休息）
│   │       ├── presets.js          # 预设管理
│   │       ├── dataStore.js        # 数据存储
│   │       ├── musicPlayer.js      # 音乐播放器
│   │       ├── planMode.js         # 番茄计划模式
│   │       ├── appState.js         # 应用状态管理
│   │       ├── dom.js              # DOM 元素引用
│   │       ├── callbacks.js        # 回调函数定义
│   │       └── tutorial.js         # 教程弹窗
│   └── modules/
│       └── musicProcess.js     # 音乐进程管理
└── music-player/           # Python 音乐播放器
    ├── music.py            # 播放器源码
    └── music.exe           # 打包好的播放器 (⚠️ 当前为测试版本)
```

## 🎵 音乐播放器

音乐播放器由独立的 Python 程序实现，通过 stdin/stdout 与 Electron 通信。

### 功能

- ▶️ 播放/暂停
- ⏭️ 下一首 / ⏮ 上一首
- 🔀 随机播放（启动时自动随机排序）
- 🎚️ 进度条拖动跳转
- 🔊 音量调节（快捷键：Ctrl+↑/↓）
- 🎧 输出设备切换（点击设备按钮选择）
- 📊 实时进度同步（由 Python 端精确控制）
- ⚡ 后台预加载（首次播放无卡顿）
- 🔄 自动连播（歌曲结束自动播放下一首）

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `右 Ctrl + 右 Shift` | 播放/暂停 |
| `右 Ctrl + ←` | 上一首 |
| `右 Ctrl + →` | 下一首 |
| `右 Ctrl + ↑` | 音量增加 |
| `右 Ctrl + ↓` | 音量减少 |

### 自定义音乐

将音乐文件放入 `music-player/music/` 文件夹即可。

支持格式：`.wav`、`.mp3`、`.flac`、`.ogg`、`.m4a`

---

# 📖 开发人员手册

> 本文档面向开发人员，详细介绍项目架构和如何添加新功能。

## 目录

1. [技术栈](#技术栈)
2. [Electron 架构详解](#electron-架构详解)
3. [核心模块说明](#核心模块说明)
4. [如何添加新功能](#如何添加新功能)
5. [常见问题](#常见问题)

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 34.x | 桌面应用框架 |
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式和动画 |
| JavaScript (ES6+) | - | 业务逻辑 |
| localStorage | - | ~~本地数据存储~~ (已废弃) |
| JSON 文件 | - | 本地数据持久化存储 |
| Python | 3.x | 音乐播放器 |

---

## Electron 架构详解

### 三大核心概念

Electron 应用由**三个进程**组成：

#### 1. 主进程 (Main Process)

**文件位置**: `main.js`

**特点**:
- 运行在 Node.js 环境中
- 一个应用只有一个主进程
- 可以访问所有 Node.js API（文件系统、系统 API 等）
- 负责创建和管理 BrowserWindow 窗口

**主要职责**:
```javascript
// main.js 示例

const { app, BrowserWindow, ipcMain, Notification } = require('electron')

// 1. 创建窗口
function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 780,
    webPreferences: {
      nodeIntegration: false,      // 禁止渲染进程直接使用 Node.js
      contextIsolation: true,      // 启用上下文隔离（安全）
      preload: path.join(__dirname, 'preload.js')  // 预加载脚本
    }
  })
  win.loadFile('src/index.html')
}

// 2. 监听渲染进程的消息（IPC 通信）
ipcMain.on('close-window', () => {
  BrowserWindow.getFocusedWindow().close()
})

// 3. 应用生命周期
app.whenReady().then(createWindow)
```

#### 2. 预加载脚本 (Preload Script)

**文件位置**: `preload.js`

**特点**:
- 在渲染进程加载页面前执行
- 可以访问 Node.js API
- 通过 `contextBridge` 安全地暴露 API 给渲染进程

**主要职责**:
```javascript
// preload.js 示例

const { contextBridge, ipcRenderer } = require('electron')

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 渲染进程可以通过 window.electronAPI.closeWindow() 调用
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // 带参数的调用
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body })
  },

  // 音乐播放器 API
  musicTogglePlay: () => ipcRenderer.send('music-toggle'),
  musicNext: () => ipcRenderer.send('music-next'),
  // ...
})
```

#### 3. 渲染进程 (Renderer Process)

**文件位置**: `src/index.html`, `src/scripts/`

**特点**:
- 运行在浏览器环境中
- 每个窗口对应一个渲染进程
- **不能直接访问 Node.js API**（安全限制）
- 通过 `window.electronAPI` 调用主进程功能

**主要职责**:
```javascript
// 渲染进程中的代码（renderer.js 或模块）

// ✅ 正确：通过预加载脚本暴露的 API
window.electronAPI.showNotification('标题', '内容')

// ❌ 错误：渲染进程中不能直接使用 Node.js
// const fs = require('fs')  // 会报错！
```

### 进程通信流程图

```
┌──────────────────┐      IPC      ┌──────────────────┐
│                  │  ──────────>  │                  │
│   渲染进程        │              │     主进程        │
│  (浏览器环境)     │  <──────────  │   (Node.js环境)  │
│                  │      IPC      │                  │
└──────────────────┘               └──────────────────┘
        │                                   │
        │  window.electronAPI.xxx()         │
        │  (通过 preload.js 暴露)            │
        └───────────────────────────────────┘
```

---

## 核心模块说明

### 模块化设计原则

每个模块遵循以下规范：

```javascript
// 模块模板
;(function() {
  'use strict'

  // ============ 私有变量 ============
  let elements = {}   // DOM 元素引用
  let callbacks = {}  // 回调函数
  let state = {}      // 模块状态

  // ============ 私有方法 ============
  function privateFunction() {
    // 内部逻辑
  }

  // ============ 公共方法 ============
  function init(els, cbs) {
    elements = els
    callbacks = cbs
    // 初始化逻辑
  }

  function doSomething() {
    // 对外接口
  }

  // ============ 导出到全局 ============
  window.ModuleName = {
    init: init,
    doSomething: doSomething
  }
})()
```

### 各模块详细说明

#### timer.js - 计时器模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els, cbs)` | DOM元素对象, 回调对象 | 初始化计时器 |
| `start()` | - | 开始计时 |
| `pause()` | - | 暂停计时 |
| `reset()` | - | 重置计时 |
| `toggle()` | - | 切换计时状态 |
| `setTime(minutes)` | 分钟数 | 设置计时时长 |
| `getIsRunning()` | - | 获取是否正在计时 |

**回调函数**:
```javascript
Timer.init(elements, {
  onStatusChange: (status) => {},  // status: 'running' | 'paused' | 'ready'
  onEnabledChange: (enabled) => {}, // enabled: true | false
  onComplete: () => {}             // 计时完成时触发
})
```

#### wheelPicker.js - 滚筒选择器模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(pickerEl, columnEl, callback)` | 容器元素, 列元素, 值变化回调 | 初始化选择器 |
| `setValue(val)` | 数值(1-120) | 设置当前值 |
| `getValue()` | - | 获取当前值 |
| `setEnabled(enabled)` | boolean | 设置启用/禁用 |
| `setChangeCallback(callback)` | 函数 | 设置值变化回调 |

#### stats.js - 统计模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els)` | DOM元素对象 | 初始化统计 |
| `increment(minutes)` | 分钟数 | 增加统计数据 |
| `getTodayCount()` | - | 获取今日完成数 |
| `getTotalMinutes()` | - | 获取累计专注分钟数 |

#### dataStore.js - 数据存储模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `load()` | - | 加载数据（异步） |
| `save()` | - | 保存数据（异步，带防抖） |
| `getStats()` | - | 获取统计数据 |
| `updateStats(stats)` | 统计对象 | 更新统计数据 |
| `getPresets()` | - | 获取预设数据 |
| `updatePresets(presets)` | 预设对象 | 更新预设数据 |

#### presets.js - 预设管理模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els, cbs)` | DOM元素对象, 回调对象 | 初始化预设 |
| `render()` | - | 重新渲染预设列表 |
| `selectPreset(minutes)` | 分钟数 | 选择预设 |
| `addPreset(minutes)` | 分钟数 | 添加预设 |
| `deletePreset(minutes)` | 分钟数 | 删除预设 |
| `setMode(mode)` | 'work' \| 'break' | 切换模式 |
| `setEnabled(enabled)` | boolean | 设置启用/禁用 |
| `getActivePreset()` | - | 获取当前选中的预设 |

#### mode.js - 模式切换模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els, cbs)` | DOM元素对象, 回调对象 | 初始化模式 |
| `setMode(mode)` | 'work' \| 'break' | 切换模式 |
| `getMode()` | - | 获取当前模式 |
| `MODE` | 常量对象 | 模式枚举 {WORK, BREAK} |

#### planMode.js - 番茄计划模式模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els, cbs)` | DOM元素对象, 回调对象 | 初始化计划模式 |
| `render()` | - | 重新渲染计划列表 |
| `addItem(minutes, type)` | 分钟数, 'work'\|'break' | 添加计划项 |
| `deleteItem(index)` | 索引 | 删除计划项 |
| `startPlan()` | - | 开始执行计划 |
| `stopPlan()` | - | 停止计划 |
| `nextItem()` | - | 进入下一项 |
| `getCurrentItem()` | - | 获取当前执行项 |
| `getFirstItem()` | - | 获取列表第一项 |
| `getPlanStatus()` | - | 获取计划状态 |
| `hasPlan()` | - | 是否有计划 |

#### appState.js - 应用状态管理模块

**导出接口**:
| 属性/方法 | 说明 |
|------|------|
| `appMode` | 当前模式 ('single' \| 'plan') |
| `defaultWorkTime` | 默认工作时间 |
| `defaultBreakTime` | 默认休息时间 |
| `switchAppMode(mode)` | 切换应用模式 |
| `updateContainerColor(isBreak)` | 更新界面颜色 |

#### dom.js - DOM 元素引用模块

集中管理所有 DOM 元素引用，通过 `window.DOM` 访问。

#### callbacks.js - 回调函数定义模块

定义各模块的回调函数，通过 `window.Callbacks` 访问。

#### tutorial.js - 教程弹窗模块

管理使用说明弹窗的显示和隐藏。

#### musicPlayer.js - 音乐播放器模块 (渲染进程)

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els)` | DOM元素对象 | 初始化音乐播放器 |
| `togglePlay()` | - | 切换播放/暂停 |
| `next()` | - | 下一首 |
| `prev()` | - | 上一首 |
| `getState()` | - | 获取当前状态 |

#### musicProcess.js - 音乐进程管理模块 (主进程)

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `start(exePath)` | exe文件路径 | 启动音乐播放器进程 |
| `stop()` | - | 停止进程 |
| `togglePlay()` | - | 切换播放/暂停 |
| `next()` | - | 下一首 |
| `prev()` | - | 上一首 |
| `seek(position)` | 秒数 | 跳转进度 |
| `setVolume(volume)` | 0-1 | 设置音量 |
| `getStatus()` | - | 获取当前状态 |
| `onStatus(callback)` | 回调函数 | 状态变化回调 |
| `onTrackChange(callback)` | 回调函数 | 曲目切换回调 |
| `onPlayState(callback)` | 回调函数 | 播放状态回调 |
| `onProgress(callback)` | 回调函数 | 进度更新回调 |

---

## 如何添加新功能

### 场景一：添加一个需要调用系统功能的特性

**示例：添加"开机自启动"功能**

#### 第一步：在主进程添加功能

编辑 `main.js`：

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')

// 新增：设置开机自启动
ipcMain.on('set-auto-launch', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  })
})

// 新增：获取开机自启动状态
ipcMain.handle('get-auto-launch', () => {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
})
```

#### 第二步：在预加载脚本暴露 API

编辑 `preload.js`：

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // 原有的 API...
  
  // 新增 API
  setAutoLaunch: (enabled) => ipcRenderer.send('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch')
})
```

> **注意**：
> - `ipcRenderer.send()` 是单向通信，不需要返回值
> - `ipcRenderer.invoke()` 是双向通信，返回 Promise，主进程用 `ipcMain.handle()` 接收

#### 第三步：创建新模块

创建文件 `src/scripts/modules/settings.js`：

```javascript
/**
 * 设置模块
 */
;(function() {
  'use strict'

  let elements = {}

  function init(els) {
    elements = els
    loadSettings()
  }

  async function loadSettings() {
    const isAutoLaunch = await window.electronAPI.getAutoLaunch()
    if (elements.autoLaunchCheckbox) {
      elements.autoLaunchCheckbox.checked = isAutoLaunch
    }
  }

  // 导出到全局
  window.Settings = {
    init: init
  }
})()
```

#### 第四步：在 HTML 中引入

编辑 `src/index.html`：

```html
<script src="scripts/modules/settings.js"></script>
<script src="scripts/renderer.js"></script>
```

#### 第五步：在 renderer.js 中初始化

编辑 `src/scripts/renderer.js`：

```javascript
if (window.Settings) {
  Settings.init({
    autoLaunchCheckbox: document.getElementById('autoLaunchCheckbox')
  })
}
```

---

### 场景二：模块间通信

当新功能需要与其他模块交互时，通过回调实现。

**示例：计时完成时播放音效**

```javascript
// renderer.js 中

Timer.init(elements, {
  onComplete: () => {
    const mode = Mode.getMode()
    
    // 调用统计模块
    Stats.increment(Math.round(Timer.getTotalTime() / 60))
    
    // 调用通知
    window.electronAPI.showNotification(
      mode === 'work' ? '🍅 番茄钟完成' : '☕ 休息结束',
      mode === 'work' ? '休息一下吧~' : '继续加油！'
    )
  }
})
```

---

## 常见问题

### Q1: 为什么渲染进程不能直接使用 Node.js？

**安全原因**。渲染进程加载的是用户界面，如果可以直接访问 Node.js，恶意网页可以读取用户文件系统。

**解决方案**: 通过 `preload.js` 和 `contextBridge` 安全地暴露需要的 API。

### Q2: IPC 通信的 send 和 invoke 有什么区别？

| 方法 | 方向 | 返回值 | 主进程接收方式 |
|------|------|--------|----------------|
| `ipcRenderer.send()` | 单向 | 无 | `ipcMain.on()` |
| `ipcRenderer.invoke()` | 双向 | Promise | `ipcMain.handle()` |

使用场景：
- **send**: 不需要返回值的操作（如：关闭窗口、播放音效）
- **invoke**: 需要返回值的操作（如：获取设置状态、读取文件）

### Q3: 如何调试 Electron 应用？

1. **打开开发者工具**:
   - 代码中：`win.webContents.openDevTools()`
   - 快捷键：`Ctrl + Shift + I`（Windows）

2. **查看控制台输出**:
   - 渲染进程：开发者工具 Console 面板
   - 主进程：终端/命令行输出

### Q4: 如何处理模块加载顺序？

确保在 `index.html` 中按正确顺序加载脚本：

```html
<!-- 1. 先加载模块（被依赖的先加载） -->
<script src="scripts/modules/stats.js"></script>
<script src="scripts/modules/wheelPicker.js"></script>
<script src="scripts/modules/timer.js"></script>
<script src="scripts/modules/mode.js"></script>
<script src="scripts/modules/musicPlayer.js"></script>

<!-- 2. 最后加载入口文件 -->
<script src="scripts/renderer.js"></script>
```

---

## 快速参考

### 常用命令

```bash
# 启动开发服务器
npm start

# 打包为 Windows 应用
npm run build
```

### 关键文件清单

| 文件 | 修改场景 |
|------|----------|
| `main.js` | 添加系统级功能（文件操作、系统API、IPC接口） |
| `preload.js` | 暴露新的 IPC 接口 |
| `src/scripts/modules/*.js` | 添加新功能模块 |
| `src/scripts/modules/dataStore.js` | 数据存储相关修改 |
| `src/scripts/modules/presets.js` | 预设管理相关修改 |
| `src/scripts/modules/planMode.js` | 番茄计划相关修改 |
| `src/scripts/modules/appState.js` | 应用状态相关修改 |
| `src/scripts/renderer.js` | 协调模块、初始化 |
| `src/index.html` | 添加 UI 元素、引入脚本 |
| `src/styles/*.css` | 添加样式 |
| `music-player/music.py` | 修改音乐播放器逻辑 |

---

## 📄 许可证

MIT License
