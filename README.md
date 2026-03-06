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

## 📋 待办事项

### 🔜 计划中

- 🎯 **惩罚奖励机制** - 完成番茄钟给予奖励，未完成给予惩罚  （cxh负责）
- 📝 **备注功能** - 为每个番茄钟添加备注说明（ygd负责）
- 🎵 **智能选歌** - 根据备注内容自动选择适合的音乐风格
- 🤖 **AI 规划助手** - 接入 DeepSeek，通过自然语言自动规划番茄钟安排（wxt负责）
- 🔒 **前台专注检测** - 检测前台是否为娱乐应用，配合惩罚机制使用（lwq负责）
- 📈 **数据可视化** - 统计图表展示专注趋势
- ☁️ **云端同步** - 数据跨设备同步
- 🌙 **深色模式** - 支持明暗主题切换（ygd负责）
- ⏰ **定时提醒** - 每日固定时间提醒开始专注
- 📱 **移动端适配** - 开发配套移动应用
- 🔗 **第三方集成** - 支持与 Notion、Todoist 等工具联动
- 🏆 **成就系统** - 解锁成就徽章激励用户
- 👥 **多人协作** - 团队番茄钟，一起专注
- 📊 **周报/月报** - 自动生成专注报告
- 🎨 **自定义主题** - 用户可自定义界面颜色和样式

### 计划细节

#### cxh板块 惩罚奖励机制（菜园子系统）

##### 核心概念
- **专注模式**：用户通过拨杆开启/关闭专注模式，开启后参与奖惩机制
- **菜园子**：独立的页面，采用网格形式展示（类似开心农场），用户可以种植和管理作物
- **作物成长**：只有在「专注模式开启」+「番茄钟倒计时运行」时，作物才会生长

##### 实现步骤（已完成部分）

**第一阶段：数据层**
- ✅ 1.1 扩展 utils.js 默认数据结构 - 添加作物配置、菜园格子等
- ✅ 1.2 扩展 main.js 默认数据结构 - 与 utils.js 保持一致
- ✅ 1.3 扩展 dataStore.js - 添加 getGarden、updateGarden 方法

**第二阶段：专注模式开关**
- ✅ 2.1 在 appState.js 添加专注模式状态 - focusModeEnabled 状态和方法
- ✅ 2.2 在 index.html 添加专注模式开关 UI - 计时器下方
- ✅ 2.3 在 main-content.css 添加开关样式
- ✅ 2.4 在 dom.js 添加开关 DOM 引用
- ✅ 2.5 在 renderer.js 绑定开关事件

**第三阶段：菜园子页面**
- ✅ 3.1 创建菜园子 HTML 页面（含关闭按钮）
- ✅ 3.2 创建菜园子样式
- ✅ 3.3 创建菜园子 JS 模块
- ✅ 3.4 在主进程添加菜园子窗口
- ✅ 3.5 在主界面添加入口按钮

**第四阶段：作物成长机制（待开发）**
- [ ] 4.1 拨杆功能完善：
  - [ ] 4.1.1 专注模式开启时禁用暂停按钮
  - [ ] 4.1.2 专注模式开启时保存状态到数据文件
  - [ ] 4.1.3 应用启动时恢复专注模式状态
- [ ] 4.2 计时器与作物成长关联
- [ ] 4.3 实现重置惩罚机制

**第五阶段：完善与测试（待开发）**
- [ ] 5.1 验证数据持久化
- [ ] 5.2 边界情况处理

##### 界面修改
| 位置 | 修改内容 |
|------|----------|
| 计时器下方 | 添加「专注模式」拨杆开关 |
| 教程按钮左侧（header-buttons 容器） | 添加「菜园子」按钮，点击打开菜园子页面 |
| 新建 `src/garden.html` | 菜园子独立页面（3x4 网格布局） |

##### 规则说明

**1. 专注模式规则**
- 开启专注模式后，番茄钟**禁止暂停**（禁用暂停按钮）
- 用户可以设置多个连续的短时间倒计时（如两个15分钟），中间休息
- **重置番茄钟 = 惩罚**：所有正在成长的作物枯萎死亡，已投入的专注时间清零

**2. 作物成长规则**
- 作物只有在倒计时运行时才会生长
- 成长进度**可累积**：用户可以分段专注（如30分钟 + 30分钟 + 30分钟 完成90分钟作物）
- 只要中间没有重置，进度会一直保留
- 作物成熟后可收获至仓库

**3. 作物类型（示例，待定）**
| 作物 | 成长时间 | 稀有度 |
|------|----------|--------|
| 🥕 胡萝卜 | 25分钟 | 普通 |
| 🍅 番茄 | 50分钟 | 普通 |
| 🌻 向日葵 | 90分钟 | 稀有 |
| 🌹 玫瑰 | 120分钟 | 稀有 |
| 🌳 金桂树 | 180分钟 | 传说 |

**4. 种子获取方式（待定）**
- 基础作物种子：每日领取 / 金币购买
- 高级作物种子：通过低级作物产物兑换 / 金币购买
- 特殊种子：成就奖励 / 特定条件解锁

**5. 菜园模式（两种方案待定）**

| 对比项 | 无限延伸模式（成就墙） | 固定大小模式 |
|--------|------------------------|--------------|
| **菜园大小** | 无限延伸，作为成就展示墙 | 固定大小（如3×4=12格），初始解锁部分格子 |
| **作物采摘** | ❌ 不允许采摘，成熟后保留在菜地 | ✅ 允许采摘，进入背包 |
| **背包内容** | 只有种子，无完整作物 | 种子 + 完整作物 |
| **奖励方式** | 完成种植获得金币 或 收获原作物种子 | 采摘获得完整作物，可出售换金币 |
| **高级种子获取** | 成就奖励 / 低级作物种子兑换 | 低级作物兑换 / 金币购买 |
| **同时种植** | 一次只能种植一株 | 可同时种植多株（收益与风险并存） |
| **重置惩罚** | 当前种植的作物枯萎 | 所有正在成长的作物同时枯萎 |

**方案A：无限延伸模式（成就墙）**
- 菜园无限延伸，作为用户的成就展示墙
- 作物成熟后不允许采摘，保留在菜地上展示
- 背包中只有种子，没有完整作物
- 奖励机制：
  - 完成种植获得金币
  - 或直接收获原作物的种子（如种番茄获得番茄种子）
- 高级种子获取：成就奖励 / 低级作物种子兑换

**方案B：固定大小模式**
- 固定大小菜地（如3×4=12格）
- 初始只解锁部分格子（如6格），剩余格子通过作物成品或金币解锁
- 种植完成后可采摘作物进入背包
- 背包包含：种子 + 完整作物
- 高级种子获取：低级作物兑换 / 金币购买
- 可同时种植多个作物，**收益与风险并存**：重置倒计时会导致所有正在成长的作物同时枯萎
- 未来配合强制模式（倒计时时禁止使用娱乐类应用）效果更佳

##### 菜园子页面功能
- **种植区域**：网格形式展示，每个格子可种植一棵作物，显示作物图标和成长进度
- **种子背包**：展示当前拥有的种子，点击可种植
- **（可选）仓库**：存放已收获的作物（固定大小模式）
- **（可选）商店**：购买种子
- **（可选）金币显示**：当前金币数量

##### 数据存储
- 作物状态（种子库存、正在成长的作物、已收获的作物）
- 菜园布局信息（每个格子的作物及成长进度）
- 金币数量（如启用）

#### ygd板块 备注功能 深色模式
- **在...（哪里）增加备注，允许用户...**
- **深色模式中把..颜色调整为...**
- **...**

#### wxt板块 AI 规划助手
- **（怎么接入deepseek）**
- **在...（哪里）设置按钮以及输入文字，以调用AI做规划**
- **（如何把deepseek返回内容变为番茄计划）...**
- **...**

#### lwq板块 前台专注检测（强制/半强制专注）

##### 核心概念
- **前台检测**：通过 Python 程序获取当前前台窗口标题/进程名，判断是否为娱乐应用
- **半强制模式**：专注模式下开启检测，发现娱乐前台时弹窗警告，三次警告触发惩罚
- **惩罚联动**：与菜园子系统配合，三次警告后使正在种的菜枯萎

##### 检测优先级（从高到低）

```
白名单匹配 → 黑名单匹配 → 历史记录判断 → DeepSeek AI 询问
```

| 优先级 | 检测方式 | 说明 |
|--------|----------|------|
| 1 | 白名单 | 用户自定义的工作/学习应用列表（如：VSCode、Notion），优先级最高避免误判 |
| 2 | 黑名单 | 用户自定义的娱乐应用列表（如：游戏、视频网站） |
| 3 | 历史记录 | 根据用户过往的"不是娱乐"反馈学习 |
| 4 | DeepSeek | 无法判断时调用 AI 分析窗口标题是否为娱乐 |

##### 实现步骤

**第一阶段：基础检测能力**
- ✅ 1.1 完善 `foreground_inspection.py` - 获取前台窗口标题/进程名
- ✅ 1.2 创建配置文件 `config.json` - 存储黑名单、白名单、历史记录
- ✅ 1.3 实现黑名单/白名单匹配逻辑
- ✅ 1.4 实现历史记录存储和查询

**第二阶段：AI 辅助判断**
- ✅ 2.1 接入 DeepSeek API
- ✅ 2.2 封装判断函数：输入窗口标题，返回是否为娱乐
- ✅ 2.3 处理 API 调用失败/超时的降级逻辑

**第三阶段：与番茄钟集成**
- [ ] 3.1 在 Electron 主进程中启动/停止检测进程
- [ ] 3.2 专注模式开启时自动启动检测
- [ ] 3.3 检测到娱乐前台时通过 IPC 通知渲染进程

**第四阶段：警告弹窗与惩罚**
- [ ] 4.1 设计警告弹窗 UI（两个按钮：「不是娱乐」「知道了」）
- [ ] 4.2 实现警告计数（同一专注周期内累计）
- [ ] 4.3 三次警告后触发惩罚：调用菜园子系统使作物枯萎
- [ ] 4.4 「不是娱乐」按钮：将当前窗口加入白名单或历史记录

##### 界面设计

**警告弹窗示意：**
```
┌─────────────────────────────┐
│  ⚠️ 检测到娱乐前台           │
│                             │
│  当前前台：XXX游戏           │
│                             │
│  ┌───────────┐ ┌──────────┐ │
│  │ 不是娱乐   │ │  知道了  │ │
│  └───────────┘ └──────────┘ │
└─────────────────────────────┘
```

##### 文件结构

```
foreground_inspection/
├── foreground_inspection.py   # 前台检测主程序
├── foreground_inspection.exe  # 打包好的检测程序
├── config.json                # 黑名单/白名单/历史记录配置
├── build/                     # PyInstaller 打包目录
└── dist/                      # 打包输出目录
```

##### 数据流

```
番茄钟专注模式开启
        │
        ▼
启动 foreground_inspection.exe（定时轮询）
        │
        ▼
检测到前台窗口变化 → 判断是否娱乐
        │
        ├── 白名单匹配 ──────────────→ 不是娱乐 → 继续
        │
        ├── 黑名单匹配 ──────────────→ 是娱乐 → 发送警告
        │
        ├── 历史记录匹配 ────────────→ 返回历史判断结果
        │
        └── 都不匹配 ────────────────→ 调用 DeepSeek → 返回判断结果
                                              │
                                              ▼
                                        结果存入历史记录
```

##### 配置文件示例 (config.json)

```json
{
  "api_key": "your-deepseek-api-key",
  "whitelist": [
    "Visual Studio Code",
    "Notion",
    "Typora"
  ],
  "blacklist": [
    "游戏",
    "Steam",
    "bilibili",
    "抖音"
  ],
  "history": {
    "微信": "不是",
    "QQ音乐": "是",
    "Steam": "是"
  }
}
```

### ✅ 已完成

- ~~🎵 **音乐播放器** - 基础播放功能~~
- ~~🎧 **输出设备切换** - 支持切换音频输出设备~~
- ~~⚠️ **错误处理** - 播放失败/超时/进程异常时的错误提示~~
- ~~📝 **番茄计划模式** - 创建计划列表自动依次执行~~
- ~~📊 **数据持久化** - 统计数据本地存储~~
- ~~🎯 **惩罚奖励机制（第一阶段）** - 数据层：菜园子数据结构~~
- ~~🎯 **惩罚奖励机制（第二阶段）** - 专注模式开关 UI~~
- ~~🎯 **惩罚奖励机制（第三阶段）** - 菜园子页面和窗口~~
- ~~🔒 **前台专注检测（第一阶段）** - 基础检测能力：窗口标题获取、黑白名单匹配、历史记录~~
- ~~🔒 **前台专注检测（第二阶段）** - AI 辅助判断：DeepSeek API 接入~~

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

## 👥 团队协作指南

### Git 基础操作

当你修改了代码后，需要提交到仓库：

```bash
# 1. 查看修改了哪些文件
git status

# 2. 添加所有修改的文件到暂存区
git add .

# 3. 提交修改（-m 后面写提交说明）
git commit -m "feat: 添加了新功能"

# 4. 推送到远程仓库
git push
```

> ⚠️ 如果 `git push` 报错提示没有权限，请联系仓库管理员添加你为协作者（Collaborator）。

### Commit 提交规范

请使用规范的提交前缀，方便查看历史记录：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: 添加开机自启动功能` |
| `fix:` | 修复 Bug | `fix: 修复计时器暂停后时间重置的问题` |
| `docs:` | 文档修改 | `docs: 更新 README 安装说明` |
| `style:` | 代码格式修改（不影响功能） | `style: 调整代码缩进格式` |
| `refactor:` | 代码重构 | `refactor: 重构计时器模块` |
| `perf:` | 性能优化 | `perf: 优化渲染性能` |
| `test:` | 测试相关 | `test: 添加计时器单元测试` |
| `chore:` | 构建/工具相关 | `chore: 更新依赖版本` |

### 示例

```bash
# 添加新功能
git add .
git commit -m "feat: 添加深色模式支持"

# 修复 Bug
git add .
git commit -m "fix: 修复音乐播放器无法暂停的问题"

# 更新文档
git add .
git commit -m "docs: 补充团队协作指南"
```

### 拉取最新代码

在开始工作前，记得先拉取最新代码：

```bash
git pull
```

## 📁 项目结构

```
electron_pomodoro/
├── main.js                 # Electron 主进程
├── preload.js              # 预加载脚本 (IPC 通信)
├── package.json            # 项目配置
├── src/
│   ├── index.html          # 页面入口
│   ├── garden.html         # 菜园子页面
│   ├── styles/
│   │   ├── base.css            # 基础样式 + 公共滚动条样式
│   │   ├── sidebar.css         # 侧边栏样式
│   │   ├── main-content.css    # 主内容区样式
│   │   ├── music-player.css    # 音乐播放器样式
│   │   ├── modal.css           # 弹窗样式
│   │   ├── modes.css           # 模式样式
│   │   └── garden.css          # 菜园子样式
│   ├── scripts/
│   │   ├── renderer.js         # 渲染进程入口
│   │   └── modules/            # 功能模块
│   │       ├── utils.js            # 公共工具函数 (formatTime, 默认数据, 作物配置)
│   │       ├── dom.js              # DOM 元素引用
│   │       ├── dataStore.js        # 数据存储
│   │       ├── stats.js            # 统计模块
│   │       ├── wheelPicker.js      # 滚筒选择器
│   │       ├── timer.js            # 计时器
│   │       ├── mode.js             # 模式切换（工作/休息）
│   │       ├── presets.js          # 预设管理
│   │       ├── planMode.js         # 番茄计划模式
│   │       ├── appState.js         # 应用状态管理（含专注模式开关）
│   │       ├── garden.js           # 菜园子模块
│   │       ├── musicPlayer.js      # 音乐播放器
│   │       ├── callbacks.js        # 回调函数定义
│   │       └── tutorial.js         # 教程弹窗
│   └── modules/
│       └── musicProcess.js     # 音乐进程管理
├── music-player/           # Python 音乐播放器
│   ├── music.py                # 播放器源码
│   ├── music.exe               # 打包好的播放器
│   ├── youget_download.py      # B站音乐下载工具
│   └── 打包复制.bat             # 打包脚本（需Python环境）
└── foreground_inspection/  # Python 前台检测程序
    ├── foreground_inspection.py   # 前台检测源码
    ├── foreground_inspection.exe  # 打包好的检测程序
    ├── config.json                # 黑名单/白名单/历史记录配置
    └── 打包复制.bat                # 打包脚本（需Python环境）
```

## 🎵 音乐播放器

音乐播放器由独立的 Python 程序实现，通过 stdin/stdout 与 Electron 通信。

### 功能

- ▶️ 播放/暂停
- ⏭️ 下一首 / ⏮ 上一首
- 🔀 随机播放（启动时自动随机排序）
- 🎚️ 进度条拖动跳转
- 🔊 音量调节（快捷键：Ctrl+↑/↓）
- 🎧 输出设备切换（点击设备按钮选择，⚠️ 除非明确知道在做什么，请勿更改）
- 📊 实时进度同步（由 Python 端精确控制）
- ⚡ 后台预加载（首次播放无卡顿）
- 🔄 自动连播（歌曲结束自动播放下一首）
- ⚠️ 错误处理（播放失败/超时/进程异常时显示提示）

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

### 错误提示

当出现以下情况时，音乐播放器会显示错误提示：

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| 无音乐 | `music/` 文件夹为空 | 添加音频文件后重启 |
| 播放失败，请切换输出设备后重启番茄钟 | 音频设备不可用 | 切换输出设备后重启 |
| 输出设备异常，请切换输出设备后重试 | 设备响应异常 | 切换输出设备 |
| 播放无响应，请检查输出设备或重启番茄钟 | 3秒内无响应 | 检查设备或重启 |
| 播放进程未运行，请重启番茄钟 | Python进程已退出 | 重启番茄钟 |

## 📥 B站音乐下载工具

`music-player/youget_download.py` 是一个用于从B站下载纯音乐视频并提取音频的工具。

### 功能特性

- 🔗 支持 B站视频链接
- 🎬 自动解析视频格式，可选择画质
- 🎵 自动提取音频并转换为 MP3 格式
- 🧹 自动清理下载的临时文件
- ⚠️ 启动时检查 `you-get` 和 `ffmpeg` 依赖

### 环境要求

- **Python** 3.x
- **you-get** - 视频下载工具
  ```bash
  pip install you-get
  ```
- **ffmpeg** - 音频转换工具
  - Windows: 从 [ffmpeg.org](https://ffmpeg.org/download.html) 下载并添加到系统 PATH

### 使用方法

```bash
# 进入工具目录
cd music-player

# 运行脚本
python youget_download.py

# 按提示输入B站视频链接即可
```

下载的 MP3 文件会自动保存到 `music-player/music/` 目录。

### 注意事项

- 仅支持有音频的视频，不支持纯无声视频
- 部分视频可能因版权限制无法下载
- 建议下载纯音乐/BGM类视频以获得最佳体验

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
| `getPlanList()` | - | 获取计划列表 |
| `updatePlanList(planList)` | 计划数组 | 更新计划列表 |

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

#### utils.js - 公共工具函数模块

**导出接口**:
| 方法/属性 | 说明 |
|------|------|
| `formatTime(seconds, showLeadingZero)` | 格式化秒数为 MM:SS 格式 |
| `DEFAULT_PRESETS` | 默认预设常量 `{work: [15,25,45,60], break: [5,10,15]}` |
| `createDefaultData()` | 创建默认数据结构对象 |

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
| `start(exePath, deviceId)` | exe路径, 设备ID | 启动音乐播放器进程 |
| `stop()` | - | 停止进程 |
| `togglePlay()` | - | 切换播放/暂停 |
| `next()` | - | 下一首 |
| `prev()` | - | 上一首 |
| `seek(position)` | 秒数 | 跳转进度 |
| `setVolume(volume)` | 0-1 | 设置音量 |
| `getStatus()` | - | 获取当前状态 |
| `getDevices()` | - | 获取输出设备列表 |
| `setDevice(deviceId)` | 设备ID | 设置输出设备 |
| `onReady(callback)` | 回调函数 | 准备就绪回调 |
| `onStatus(callback)` | 回调函数 | 状态变化回调 |
| `onTrackChange(callback)` | 回调函数 | 曲目切换回调 |
| `onPlayState(callback)` | 回调函数 | 播放状态回调 |
| `onProgress(callback)` | 回调函数 | 进度更新回调 |
| `onDevices(callback)` | 回调函数 | 设备列表回调 |
| `onNoMusic(callback)` | 回调函数 | 无音乐回调 |
| `onPlayError(callback)` | 回调函数 | 播放错误回调 |

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

## 🆕 何时需要新建 HTML 页面

> **重要提示**：当前 `index.html` 已经承载了大量功能，继续往里添加内容会让代码越来越难维护。在开发新功能前，请先阅读本章节，判断是否需要新建 HTML 页面。

### 为什么需要考虑这个问题？

当前 `index.html` 已经包含：
- 主计时器界面
- 音乐播放器
- 教程弹窗
- 侧边栏（预设列表 + 计划列表）
- 各种模式切换逻辑

**如果继续往里塞内容**：
1. HTML 文件会越来越长，难以阅读
2. CSS 样式冲突风险增加
3. JavaScript 模块间耦合度升高
4. 后期维护成本指数级增长

---

### 两种扩展方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **新建 HTML 页面** | 完全独立、易维护、可复用、代码分离清晰 | 需要处理窗口间通信、数据共享稍复杂 | 设置页、独立功能模块、数据可视化页面 |
| **当前页面弹窗** | 实现简单、共享状态方便、无需额外通信 | HTML 会越来越臃肿、样式容易冲突 | 简单提示、确认对话框、小型输入框 |

---

### 根据待办功能的具体建议

| 功能 | 推荐方式 | 原因 |
|------|----------|------|
| **惩罚奖励机制** | ✅ 新建 HTML | 独立的功能模块，需要展示奖励/惩罚结果，界面复杂 |
| **备注功能** | ❌ 当前页面弹窗 | 只是一个简单的输入框，不需要独立页面 |
| **深色模式** | ❌ 不需要新页面 | 纯 CSS 变量切换，在当前页面实现即可 |
| **AI 规划助手** | ⚠️ 可选 | 如果是侧边面板可在当前页面，如果是独立对话框建议新建 |
| **数据可视化** | ✅ 新建 HTML | 统计图表页面，功能独立，需要大量图表库代码 |
| **成就系统** | ✅ 新建 HTML | 成就展示页面，可以做成独立的成就墙 |
| **周报/月报** | ✅ 新建 HTML | 报告生成和展示，功能独立 |
| **专注锁屏** | ✅ 新建 HTML | 全屏锁屏界面，必须独立 |

---

### 如何新建 HTML 页面

#### 第一步：创建 HTML 文件

在 `src/` 目录下创建新的 HTML 文件，例如 `src/settings.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>设置</title>
  <link rel="stylesheet" href="styles/settings.css">
</head>
<body>
  <div class="settings-container">
    <!-- 你的内容 -->
  </div>
  <script src="scripts/modules/settingsModule.js"></script>
</body>
</html>
```

#### 第二步：在主进程创建窗口

编辑 `main.js`，添加创建新窗口的逻辑：

```javascript
// 存储设置窗口的引用
let settingsWindow = null

// 创建设置窗口
function createSettingsWindow() {
  // 如果窗口已存在，聚焦它
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    parent: BrowserWindow.getFocusedWindow(), // 设置父窗口
    modal: true, // 模态窗口（可选，会阻止操作父窗口）
    frame: false, // 无边框（与主窗口风格一致）
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // 复用同一个 preload
    }
  })

  settingsWindow.loadFile('src/settings.html')

  // 窗口关闭时清理引用
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

// 监听打开设置窗口的请求
ipcMain.on('open-settings', () => {
  createSettingsWindow()
})

// 监听关闭设置窗口的请求
ipcMain.on('close-settings', () => {
  if (settingsWindow) {
    settingsWindow.close()
  }
})
```

#### 第三步：在 preload.js 暴露 API

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // 原有的 API...
  
  // 新增窗口相关 API
  openSettings: () => ipcRenderer.send('open-settings'),
  closeSettings: () => ipcRenderer.send('close-settings'),
})
```

#### 第四步：在主窗口添加入口按钮

在 `src/index.html` 中添加打开新页面的按钮：

```html
<button id="openSettingsBtn">⚙️ 设置</button>
```

在 `src/scripts/renderer.js` 中添加事件：

```javascript
document.getElementById('openSettingsBtn').addEventListener('click', () => {
  window.electronAPI.openSettings()
})
```

---

### 窗口间数据共享

新窗口和主窗口之间的数据共享有以下几种方式：

#### 方式一：通过 JSON 文件（推荐）

两个窗口都通过 `DataStore` 读写同一个 JSON 文件，数据自动同步。

```javascript
// 新窗口中读取数据
const data = await window.electronAPI.readData()

// 新窗口中保存数据
await window.electronAPI.writeData(newData)
```

**优点**：简单可靠，数据持久化
**缺点**：需要手动刷新数据

#### 方式二：通过 IPC 消息传递

主窗口和新窗口通过主进程中转消息。

```javascript
// 主进程 - 转发消息
ipcMain.on('sync-data', (event, data) => {
  // 转发给所有窗口
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('data-updated', data)
  })
})

// 渲染进程 - 发送消息
window.electronAPI.syncData(data)

// 渲染进程 - 接收消息
window.electronAPI.onDataUpdated((data) => {
  // 更新界面
})
```

**优点**：实时同步
**缺点**：代码稍复杂

---

### 新建页面的完整示例

以「惩罚奖励机制」为例：

```
新增文件：
├── src/
│   ├── reward.html          # 惩罚奖励页面
│   ├── styles/
│   │   └── reward.css       # 惩罚奖励样式
│   └── scripts/
│       └── modules/
│           └── reward.js    # 惩罚奖励逻辑

修改文件：
├── main.js                  # 添加创建窗口逻辑
└── preload.js               # 暴露新窗口 API
```

**reward.html 结构示例**：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>奖励</title>
  <link rel="stylesheet" href="styles/reward.css">
</head>
<body>
  <div class="reward-container">
    <div class="reward-header">
      <h1>🎉 恭喜完成！</h1>
      <button class="btn-close" id="closeBtn">×</button>
    </div>
    <div class="reward-content">
      <div class="reward-icon">🏆</div>
      <p class="reward-text">你获得了一个奖励！</p>
      <p class="reward-detail">累计专注 100 分钟</p>
    </div>
    <button class="btn-primary" id="claimBtn">领取奖励</button>
  </div>
  <script src="scripts/modules/reward.js"></script>
</body>
</html>
```

**reward.js 逻辑示例**：
```javascript
;(function() {
  'use strict'

  // 关闭按钮
  document.getElementById('closeBtn').addEventListener('click', () => {
    window.electronAPI.closeReward()
  })

  // 领取奖励按钮
  document.getElementById('claimBtn').addEventListener('click', async () => {
    // 保存奖励数据
    const data = await window.electronAPI.readData()
    data.rewards = data.rewards || []
    data.rewards.push({
      type: 'completion',
      time: new Date().toISOString()
    })
    await window.electronAPI.writeData(data)
    
    // 关闭窗口
    window.electronAPI.closeReward()
  })
})()
```

---

### 总结：决策流程图

```
开始开发新功能
      │
      ▼
是否需要大量 UI 元素？
      │
      ├──── 否 ────▶ 是否是简单的输入/确认？
      │                    │
      │                    ├──── 是 ────▶ 使用当前页面弹窗
      │                    │
      │                    └──── 否 ────▶ 考虑新建 HTML
      │
      └──── 是 ────▶ 是否与主界面功能独立？
                           │
                           ├──── 是 ────▶ ✅ 新建 HTML 页面
                           │
                           └──── 否 ────▶ 评估后决定
```

**记住**：当你犹豫不决时，新建页面通常是更安全的选择。代码分离总比臃肿好！

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
