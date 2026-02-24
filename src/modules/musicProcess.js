/**
 * 音乐播放器进程管理模块
 * 负责与music.exe通过stdin/stdout通信
 */

const { spawn } = require('child_process')
const path = require('path')
const readline = require('readline')

class MusicProcess {
  constructor() {
    this.process = null
    this.isRunning = false
    this.onStatusCallback = null
    this.onTrackChangeCallback = null
    this.onPlayStateCallback = null
    this.onProgressCallback = null
  }

  /**
   * 启动音乐播放器进程
   * @param {string} exePath - music.exe的路径
   */
  start(exePath) {
    if (this.process) {
      console.log('[MusicProcess] 进程已在运行')
      return
    }

    const fullPath = exePath || path.join(__dirname, '../../music.exe')
    
    try {
      this.process = spawn(fullPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(fullPath),
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      })

      this.isRunning = true
      console.log('[MusicProcess] 进程已启动:', fullPath)

      // 创建readline接口处理stdout，指定UTF-8编码
      const rl = readline.createInterface({
        input: this.process.stdout.setEncoding('utf8'),
        crlfDelay: Infinity
      })

      rl.on('line', (line) => {
        this.handleMessage(line)
      })

      // 处理stderr
      this.process.stderr.on('data', (data) => {
        console.error('[MusicProcess] stderr:', data.toString())
      })

      // 处理进程退出
      this.process.on('close', (code) => {
        console.log('[MusicProcess] 进程已退出, code:', code)
        this.process = null
        this.isRunning = false
      })

      // 处理错误
      this.process.on('error', (err) => {
        console.error('[MusicProcess] 进程错误:', err)
        this.process = null
        this.isRunning = false
      })

    } catch (err) {
      console.error('[MusicProcess] 启动失败:', err)
      this.process = null
      this.isRunning = false
    }
  }

  /**
   * 停止音乐播放器进程
   */
  stop() {
    if (this.process) {
      this.process.kill()
      this.process = null
      this.isRunning = false
      console.log('[MusicProcess] 进程已停止')
    }
  }

  /**
   * 处理来自music.exe的消息
   * @param {string} line - JSON格式的消息
   */
  handleMessage(line) {
    try {
      const message = JSON.parse(line)
      const { event, data } = message

      console.log('[MusicProcess] 收到消息:', event, data)

      switch (event) {
        case 'status':
          if (this.onStatusCallback) {
            this.onStatusCallback(data)
          }
          break
        case 'track_change':
          if (this.onTrackChangeCallback) {
            this.onTrackChangeCallback(data)
          }
          break
        case 'play_state':
          if (this.onPlayStateCallback) {
            this.onPlayStateCallback(data)
          }
          break
        case 'progress':
          if (this.onProgressCallback) {
            this.onProgressCallback(data)
          }
          break
        default:
          console.log('[MusicProcess] 未知事件:', event)
      }
    } catch (err) {
      console.error('[MusicProcess] 解析消息失败:', err, line)
    }
  }

  /**
   * 发送命令到music.exe
   * @param {object} command - 命令对象
   */
  sendCommand(command) {
    if (!this.process || !this.process.stdin.writable) {
      console.error('[MusicProcess] 进程未运行,无法发送命令')
      return false
    }

    try {
      const commandStr = JSON.stringify(command) + '\n'
      this.process.stdin.write(commandStr, 'utf8')
      console.log('[MusicProcess] 发送命令:', command)
      return true
    } catch (err) {
      console.error('[MusicProcess] 发送命令失败:', err)
      return false
    }
  }

  // ============ 控制命令 ============

  /**
   * 切换播放/暂停
   */
  togglePlay() {
    return this.sendCommand({ command: 'toggle' })
  }

  /**
   * 下一首
   */
  next() {
    return this.sendCommand({ command: 'next' })
  }

  /**
   * 上一首
   */
  prev() {
    return this.sendCommand({ command: 'prev' })
  }

  /**
   * 跳转到指定位置
   * @param {number} position - 位置(秒)
   */
  seek(position) {
    return this.sendCommand({ command: 'seek', position })
  }

  /**
   * 设置音量
   * @param {number} volume - 音量(0-1)
   */
  setVolume(volume) {
    return this.sendCommand({ command: 'set_volume', volume })
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return this.sendCommand({ command: 'get_status' })
  }

  // ============ 回调设置 ============

  onStatus(callback) {
    this.onStatusCallback = callback
  }

  onTrackChange(callback) {
    this.onTrackChangeCallback = callback
  }

  onPlayState(callback) {
    this.onPlayStateCallback = callback
  }

  onProgress(callback) {
    this.onProgressCallback = callback
  }
}

// 导出单例
const musicProcess = new MusicProcess()
module.exports = musicProcess
