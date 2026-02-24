# 番茄钟 - 开发人员手册

> 本文档面向开发人员，详细介绍项目架构和如何添加新功能。

## 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [Electron 架构详解](#electron-架构详解)
4. [项目文件结构](#项目文件结构)
5. [核心模块说明](#核心模块说明)
6. [如何添加新功能](#如何添加新功能)
7. [常见问题](#常见问题)

---

## 项目概述

番茄钟是一个基于 Electron 的桌面应用，帮助用户进行时间管理和专注工作。

### 主要功能

- ⏱️ 番茄计时（工作/休息模式）
- 🎚️ 滚筒式时间选择器
- 📊 统计数据持久化
- 🔔 系统通知

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 34.x | 桌面应用框架 |
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式和动画 |
| JavaScript (ES6+) | - | 业务逻辑 |
| localStorage | - | 本地数据存储 |

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
    height: 620,
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
  }
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

## 项目文件结构

```
番茄钟/
│
├── main.js                    # 主进程入口
│   └── 职责：创建窗口、IPC 通信、系统级功能
│
├── preload.js                 # 预加载脚本
│   └── 职责：安全暴露 API 给渲染进程
│
├── package.json               # 项目配置
│   ├── scripts: 启动和打包命令
│   └── devDependencies: 开发依赖
│
└── src/                       # 源代码目录
    │
    ├── index.html             # 页面入口
    │   └── 按顺序加载模块脚本
    │
    ├── styles/
    │   └── main.css           # 样式文件
    │
    └── scripts/
        │
        ├── renderer.js        # 渲染进程入口
        │   └── 职责：初始化所有模块、协调模块间通信
        │
        └── modules/           # 功能模块目录
            │
            ├── timer.js       # 计时器模块
            │   └── 功能：计时逻辑、进度环更新
            │
            ├── wheelPicker.js # 滚筒选择器模块
            │   └── 功能：时间选择的滚筒交互
            │
            ├── stats.js       # 统计模块
            │   └── 功能：数据存储、今日完成数统计
            │
            └── mode.js        # 模式切换模块
                └── 功能：工作/休息模式切换
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

#### mode.js - 模式切换模块

**导出接口**:
| 方法 | 参数 | 说明 |
|------|------|------|
| `init(els, cbs)` | DOM元素对象, 回调对象 | 初始化模式 |
| `setMode(mode)` | 'work' \| 'break' | 切换模式 |
| `getMode()` | - | 获取当前模式 |
| `MODE` | 常量对象 | 模式枚举 {WORK, BREAK} |

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
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 原有的 API...
  closeWindow: () => ipcRenderer.send('close-window'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  
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
  let callbacks = {}

  /**
   * 初始化设置模块
   */
  function init(els, cbs) {
    elements = els
    callbacks = cbs || {}
    
    // 绑定事件
    if (elements.autoLaunchCheckbox) {
      elements.autoLaunchCheckbox.addEventListener('change', onAutoLaunchChange)
    }
    
    // 加载当前设置
    loadSettings()
  }

  /**
   * 加载设置
   */
  async function loadSettings() {
    const isAutoLaunch = await window.electronAPI.getAutoLaunch()
    if (elements.autoLaunchCheckbox) {
      elements.autoLaunchCheckbox.checked = isAutoLaunch
    }
  }

  /**
   * 开机自启动开关变化
   */
  function onAutoLaunchChange(e) {
    const enabled = e.target.checked
    window.electronAPI.setAutoLaunch(enabled)
    
    if (callbacks.onSettingChange) {
      callbacks.onSettingChange('autoLaunch', enabled)
    }
  }

  // 导出到全局
  window.Settings = {
    init: init,
    loadSettings: loadSettings
  }
})()
```

#### 第四步：在 HTML 中引入并添加 UI

编辑 `src/index.html`：

```html
<!-- 在其他模块之后引入 -->
<script src="scripts/modules/settings.js"></script>
<script src="scripts/renderer.js"></script>
```

添加 UI 元素：

```html
<!-- 在适当位置添加设置区域 -->
<div class="settings">
  <label class="setting-item">
    <input type="checkbox" id="autoLaunchCheckbox">
    <span>开机自启动</span>
  </label>
</div>
```

#### 第五步：在 renderer.js 中初始化

编辑 `src/scripts/renderer.js`：

```javascript
// 在其他初始化之后添加

// ============ 初始化设置模块 ============
if (window.Settings) {
  Settings.init(
    {
      autoLaunchCheckbox: document.getElementById('autoLaunchCheckbox')
    },
    {
      onSettingChange: (key, value) => {
        console.log('设置已更改:', key, value)
      }
    }
  )
}
```

---

### 场景二：添加一个纯 UI 功能

**示例：添加"深色/浅色主题切换"**

这个功能不需要调用系统 API，所以只在渲染进程中实现。

#### 第一步：创建主题模块

创建文件 `src/scripts/modules/theme.js`：

```javascript
/**
 * 主题模块
 */
;(function() {
  'use strict'

  let currentTheme = 'light'
  let elements = {}
  let callbacks = {}

  /**
   * 切换主题
   */
  function toggle() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light'
    applyTheme()
    
    if (callbacks.onThemeChange) {
      callbacks.onThemeChange(currentTheme)
    }
  }

  /**
   * 应用主题
   */
  function applyTheme() {
    document.body.classList.toggle('dark-theme', currentTheme === 'dark')
    
    // 保存到本地存储
    localStorage.setItem('theme', currentTheme)
  }

  /**
   * 获取当前主题
   */
  function getTheme() {
    return currentTheme
  }

  /**
   * 初始化主题模块
   */
  function init(els, cbs) {
    elements = els
    callbacks = cbs || {}
    
    // 从本地存储加载主题
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      currentTheme = savedTheme
      applyTheme()
    }
    
    // 绑定切换按钮
    if (elements.toggleBtn) {
      elements.toggleBtn.addEventListener('click', toggle)
    }
  }

  // 导出到全局
  window.Theme = {
    init: init,
    toggle: toggle,
    getTheme: getTheme
  }
})()
```

#### 第二步：添加 CSS 样式

编辑 `src/styles/main.css`，添加深色主题样式：

```css
/* 深色主题 */
body.dark-theme .container {
  background: linear-gradient(135deg, rgba(50, 50, 60, 0.95), rgba(40, 40, 50, 0.9));
}

body.dark-theme .title {
  color: #e0e0e0;
}

body.dark-theme .time-display {
  color: #e0e0e0;
}

/* 主题切换按钮 */
.theme-toggle {
  position: absolute;
  top: 15px;
  left: 15px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  cursor: pointer;
  font-size: 14px;
}
```

#### 第三步：在 HTML 中引入

编辑 `src/index.html`：

```html
<!-- 添加主题切换按钮 -->
<button class="theme-toggle" id="themeToggleBtn">🌙</button>

<!-- 引入主题模块 -->
<script src="scripts/modules/theme.js"></script>
<script src="scripts/renderer.js"></script>
```

#### 第四步：初始化模块

编辑 `src/scripts/renderer.js`：

```javascript
// 初始化主题模块
if (window.Theme) {
  Theme.init(
    {
      toggleBtn: document.getElementById('themeToggleBtn')
    },
    {
      onThemeChange: (theme) => {
        console.log('主题已切换为:', theme)
      }
    }
  )
}
```

---

### 场景三：模块间通信

当新功能需要与其他模块交互时，通过回调实现。

**示例：计时完成时播放音效**

```javascript
// renderer.js 中

Timer.init(elements, {
  onComplete: () => {
    const mode = Mode.getMode()
    
    // 调用统计模块
    Stats.increment(Math.round(Timer.getTotalTime() / 60))
    
    // 调用音效模块（如果有）
    if (window.Sound) {
      Sound.play(mode === 'work' ? 'complete' : 'break-end')
    }
    
    // 调用通知模块
    window.electronAPI.showNotification(
      mode === 'work' ? '🍅 番茄钟完成' : '☕ 休息结束',
      mode === 'work' ? '休息一下吧~' : '继续加油！'
    )
    
    // 更新 UI
    elements.statusEl.textContent = mode === 'work' 
      ? '🎉 完成！休息一下吧' 
      : '⏰ 休息结束！继续加油'
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

3. **常用调试命令**:
```bash
# 启动应用并查看主进程日志
npm start

# 打包后测试
npx @electron/packager . 番茄钟 --platform=win32 --arch=x64 --out=dist
./dist/番茄钟-win32-x64/番茄钟.exe
```

### Q4: 如何处理模块加载顺序？

确保在 `index.html` 中按正确顺序加载脚本：

```html
<!-- 1. 先加载模块（被依赖的先加载） -->
<script src="scripts/modules/stats.js"></script>
<script src="scripts/modules/wheelPicker.js"></script>
<script src="scripts/modules/timer.js"></script>
<script src="scripts/modules/mode.js"></script>

<!-- 2. 最后加载入口文件 -->
<script src="scripts/renderer.js"></script>
```

### Q5: 如何添加新的依赖包？

```bash
# 安装运行时依赖
npm install package-name

# 安装开发依赖
npm install package-name --save-dev

# 示例：安装音效播放库
npm install howler
```

然后在代码中引入（注意：只能在主进程或 preload 中引入 Node.js 包）：

```javascript
// 主进程中
const Howler = require('howler')

// 渲染进程中（如果包支持浏览器环境）
// 直接使用全局变量或 CDN
```

### Q6: 打包后应用体积很大怎么办？

Electron 应用默认包含完整的 Chromium 和 Node.js，基础体积约 150MB。

优化方案：
1. 使用 `electron-builder` 代替 `electron-packager`（支持压缩）
2. 排除不必要的文件（创建 `.npmignore`）
3. 使用 ASAR 打包（默认启用）

---

## 快速参考

### 常用命令

```bash
# 启动开发服务器
npm start

# 打包为 Windows 应用
npm run build

# 手动打包
npx @electron/packager . 番茄钟 --platform=win32 --arch=x64 --out=dist
```

### 项目依赖

```json
{
  "devDependencies": {
    "@electron/packager": "^19.0.5",
    "electron": "^34.0.0"
  }
}
```

### 关键文件清单

| 文件 | 修改场景 |
|------|----------|
| `main.js` | 添加系统级功能（文件操作、系统API） |
| `preload.js` | 暴露新的 IPC 接口 |
| `src/scripts/modules/*.js` | 添加新功能模块 |
| `src/scripts/renderer.js` | 协调模块、初始化 |
| `src/index.html` | 添加 UI 元素、引入脚本 |
| `src/styles/main.css` | 添加样式 |

---

## 联系与贡献

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发起 Pull Request

---

*最后更新: 2024年*
