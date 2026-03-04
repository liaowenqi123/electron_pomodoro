/**
 * 公共工具函数模块
 */
;(function() {
  'use strict'

  /**
   * 格式化时间为 MM:SS 格式
   * @param {number} seconds - 秒数
   * @param {boolean} showLeadingZero - 是否显示分钟前导零，默认 true
   * @returns {string} 格式化后的时间字符串
   */
  function formatTime(seconds, showLeadingZero = true) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (showLeadingZero) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * 默认预设配置
   */
  const DEFAULT_PRESETS = {
    work: [15, 25, 45, 60],
    break: [5, 10, 15]
  }

  /**
   * 创建默认数据结构
   * @returns {Object} 默认数据对象
   */
  function createDefaultData() {
    return {
      stats: {
        date: new Date().toDateString(),
        todayCount: 0,
        totalMinutes: 0
      },
      presets: { ...DEFAULT_PRESETS },
      planList: [],
      audioDevice: null
    }
  }

  // 导出到全局
  window.Utils = {
    formatTime: formatTime,
    DEFAULT_PRESETS: DEFAULT_PRESETS,
    createDefaultData: createDefaultData
  }
})()
