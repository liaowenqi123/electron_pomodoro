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
   * 作物配置
   */
  const CROP_CONFIG = {
    carrot: { name: '胡萝卜', growTime: 25, icon: '🥕', rarity: 'common', value: 10 },
    tomato: { name: '番茄', growTime: 50, icon: '🍅', rarity: 'common', value: 20 },
    sunflower: { name: '向日葵', growTime: 90, icon: '🌻', rarity: 'rare', value: 50 },
    rose: { name: '玫瑰', growTime: 120, icon: '🌹', rarity: 'rare', value: 80 },
    osmanthus: { name: '金桂树', growTime: 180, icon: '🌳', rarity: 'legend', value: 150 }
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
      },
      theme: 'light'  
    }
  }

  // 导出到全局
  window.Utils = {
    formatTime: formatTime,
    DEFAULT_PRESETS: DEFAULT_PRESETS,
    createDefaultData: createDefaultData,
    CROP_CONFIG: CROP_CONFIG
  }
})()
