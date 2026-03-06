/**
 * 数据存储模块 - 管理应用数据的读写
 * 所有数据存储在一个 JSON 文件中
 */
;(function() {
  'use strict'

  let cachedData = null
  let saveTimeout = null

  // 使用统一的默认数据结构
  const defaultData = Utils.createDefaultData()

  // 加载数据
  async function load() {
    try {
      const data = await window.electronAPI.readData()
      cachedData = data || defaultData
      
      // 检查日期，如果不是今天则重置今日计数
      const today = new Date().toDateString()
      if (cachedData.stats.date !== today) {
        cachedData.stats.date = today
        cachedData.stats.todayCount = 0
        // 立即保存
        await save()
      }
      
      return cachedData
    } catch (e) {
      console.error('加载数据失败:', e)
      cachedData = defaultData
      return cachedData
    }
  }

  // 保存数据（防抖）
  async function save() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    return new Promise((resolve) => {
      saveTimeout = setTimeout(async () => {
        try {
          await window.electronAPI.writeData(cachedData)
          resolve(true)
        } catch (e) {
          console.error('保存数据失败:', e)
          resolve(false)
        }
      }, 300)
    })
  }

  // 立即保存（无防抖）
  async function saveImmediate() {
    try {
      await window.electronAPI.writeData(cachedData)
      return true
    } catch (e) {
      console.error('保存数据失败:', e)
      return false
    }
  }

  // 获取统计数据
  function getStats() {
    return cachedData ? cachedData.stats : defaultData.stats
  }

  // 更新统计数据
  async function updateStats(stats) {
    if (!cachedData) return false
    cachedData.stats = { ...cachedData.stats, ...stats }
    return await saveImmediate()
  }

  // 获取预设数据
  function getPresets() {
    return cachedData ? cachedData.presets : defaultData.presets
  }

  // 更新预设数据
  async function updatePresets(presets) {
    if (!cachedData) return false
    cachedData.presets = { ...cachedData.presets, ...presets }
    return await saveImmediate()
  }

  // 获取全部数据
  function getData() {
    return cachedData || defaultData
  }

  // 获取计划列表
  function getPlanList() {
    return cachedData ? (cachedData.planList || []) : []
  }

  // 更新计划列表
  async function updatePlanList(planList) {
    if (!cachedData) return false
    cachedData.planList = planList
    return await saveImmediate()
  }

  // 获取菜园数据
  function getGarden() {
    return cachedData ? cachedData.garden : Utils.createDefaultData().garden
  }

  // 更新菜园数据
  async function updateGarden(garden) {
    if (!cachedData) return false
    cachedData.garden = { ...cachedData.garden, ...garden }
    return await saveImmediate()
  }

  // 导出到全局
  window.DataStore = {
    load: load,
    save: save,
    saveImmediate: saveImmediate,
    getStats: getStats,
    updateStats: updateStats,
    getPresets: getPresets,
    updatePresets: updatePresets,
    getData: getData,
    getPlanList: getPlanList,
    updatePlanList: updatePlanList,
    getGarden: getGarden,
    updateGarden: updateGarden
  }
})()
