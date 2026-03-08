/**
 * 菜园子模块 - 管理菜园子的交互逻辑
 */
;(function() {
  'use strict'

  // DOM 元素
  let elements = {}
  
  // 状态
  let gardenData = null
  let selectedSeed = null
  let selectedPlotIndex = null

  // 作物配置
  const CROP_CONFIG = Utils.CROP_CONFIG

  /**
   * 初始化菜园子
   */
  async function init() {
    // 获取 DOM 元素
    elements = {
      coinCount: document.getElementById('coinCount'),
      gardenGrid: document.getElementById('gardenGrid'),
      seedList: document.getElementById('seedList'),
      gardenTip: document.getElementById('gardenTip'),
      gardenCloseBtn: document.getElementById('gardenCloseBtn')
    }

    // 绑定关闭按钮事件
    elements.gardenCloseBtn.addEventListener('click', () => {
      window.electronAPI.closeGarden()
    })

    // 监听刷新事件（当主页面更新作物数据时）
    if (window.electronAPI && window.electronAPI.onGardenRefresh) {
      window.electronAPI.onGardenRefresh(async () => {
        // 重新从数据库加载数据
        await loadGardenData()
        // 重新渲染界面
        render()
      })
    }

    // 加载数据
    await loadGardenData()
    
    // 渲染界面
    render()
  }

  /**
   * 确保菜园数据已加载（供外部调用）
   */
  async function ensureGardenDataLoaded() {
    if (!gardenData) {
      await loadGardenData()
    }
    return gardenData
  }

  /**
   * 加载菜园数据
   */
  async function loadGardenData() {
    try {
      const data = await window.electronAPI.readData()
      gardenData = data.garden || Utils.createDefaultData().garden
    } catch (e) {
      console.error('加载菜园数据失败:', e)
      gardenData = Utils.createDefaultData().garden
    }
  }

  /**
   * 保存菜园数据
   */
  async function saveGardenData() {
    try {
      const data = await window.electronAPI.readData()
      data.garden = gardenData
      await window.electronAPI.writeData(data)
    } catch (e) {
      console.error('保存菜园数据失败:', e)
    }
  }

  /**
   * 渲染界面
   */
  function render() {
    renderCoins()
    renderPlots()
    renderSeeds()
  }

  /**
   * 渲染金币
   */
  function renderCoins() {
    elements.coinCount.textContent = gardenData.coins || 0
  }

  /**
   * 渲染菜园格子
   */
  function renderPlots() {
    elements.gardenGrid.innerHTML = ''
    
    const plots = gardenData.plots || []
    
    plots.forEach((plot, index) => {
      const plotEl = document.createElement('div')
      plotEl.className = 'garden-plot'
      
      if (plot.locked) {
        plotEl.classList.add('locked')
        plotEl.innerHTML = '<span>🔒</span>'
      } else if (plot.crop) {
        // 有作物
        const cropConfig = CROP_CONFIG[plot.crop]
        if (cropConfig) {
          const progress = Math.min(100, (plot.progress / cropConfig.growTime) * 100)
          const isMature = progress >= 100
          
          plotEl.classList.add('has-crop')
          if (isMature) {
            plotEl.classList.add('mature')
          }
          
          plotEl.innerHTML = `
            <span class="plot-crop-icon">${cropConfig.icon}</span>
            <div class="plot-progress">
              <div class="plot-progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="plot-progress-text">${plot.progress}/${cropConfig.growTime}分钟</span>
          `
        }
      } else {
        // 空格子
        plotEl.classList.add('empty')
        plotEl.innerHTML = '<span style="opacity: 0.3; font-size: 24px;">+</span>'
      }
      
      // 选中状态
      if (selectedPlotIndex === index) {
        plotEl.classList.add('selected')
      }
      
      // 点击事件
      plotEl.addEventListener('click', () => handlePlotClick(index))
      
      elements.gardenGrid.appendChild(plotEl)
    })
  }

  /**
   * 渲染种子背包
   */
  function renderSeeds() {
    elements.seedList.innerHTML = ''
    
    const seeds = gardenData.seeds || {}
    
    Object.keys(CROP_CONFIG).forEach(cropKey => {
      const crop = CROP_CONFIG[cropKey]
      const count = seeds[cropKey] || 0
      
      const seedEl = document.createElement('div')
      seedEl.className = `seed-item ${crop.rarity}`
      
      if (count === 0) {
        seedEl.classList.add('disabled')
      }
      
      if (selectedSeed === cropKey) {
        seedEl.classList.add('selected')
      }
      
      seedEl.innerHTML = `
        <span class="seed-icon">${crop.icon}</span>
        <div class="seed-info">
          <span class="seed-name">${crop.name}</span>
          <span class="seed-count">x${count}</span>
        </div>
      `
      
      // 点击选择种子
      if (count > 0) {
        seedEl.addEventListener('click', () => handleSeedSelect(cropKey))
      }
      
      elements.seedList.appendChild(seedEl)
    })
  }

  /**
   * 处理种子选择
   */
  function handleSeedSelect(cropKey) {
    if (selectedSeed === cropKey) {
      // 取消选择
      selectedSeed = null
      updateTip('点击种子，然后点击空格子种植')
    } else {
      // 选择种子
      selectedSeed = cropKey
      const crop = CROP_CONFIG[cropKey]
      updateTip(`已选择 ${crop.name}，点击空格子种植（需要 ${crop.growTime} 分钟）`)
    }
    renderSeeds()
  }

  /**
   * 处理格子点击
   */
  function handlePlotClick(index) {
    const plot = gardenData.plots[index]
    
    // 检查是否锁定
    if (plot.locked) {
      updateTip('这个格子还未解锁')
      return
    }
    
    // 如果已有作物且成熟，可以收获
    if (plot.crop) {
      const cropConfig = CROP_CONFIG[plot.crop]
      const progress = (plot.progress / cropConfig.growTime) * 100
      
      if (progress >= 100) {
        // 收获
        harvestCrop(index)
        return
      } else {
        updateTip('作物还未成熟，无法收获')
        return
      }
    }
    
    // 如果选择了种子且格子为空，种植
    if (selectedSeed && !plot.crop) {
      plantCrop(index, selectedSeed)
    } else if (!selectedSeed) {
      updateTip('请先选择一个种子')
    }
  }

  /**
   * 种植作物
   */
  async function plantCrop(plotIndex, cropKey) {
    // 专注模式下禁止种植
    if (window.AppState && window.AppState.focusModeEnabled && window.Timer && window.Timer.getIsRunning()) {
      updateTip('专注模式下无法种植作物，请先停止专注')
      return
    }

    const seeds = gardenData.seeds || {}
    
    // 检查是否有种子
    if (!seeds[cropKey] || seeds[cropKey] <= 0) {
      updateTip('种子不足')
      return
    }
    
    // 消耗种子
    seeds[cropKey]--
    
    // 更新格子
    gardenData.plots[plotIndex] = {
      id: plotIndex,
      crop: cropKey,
      progress: 0,
      plantedAt: new Date().toISOString()
    }
    
    // 保存并渲染
    await saveGardenData()
    selectedSeed = null
    updateTip('种植成功！专注计时会让作物成长')
    render()
  }

  /**
   * 收获作物
   */
  async function harvestCrop(plotIndex) {
    const plot = gardenData.plots[plotIndex]
    const cropConfig = CROP_CONFIG[plot.crop]
    
    // 添加到仓库
    gardenData.warehouse = gardenData.warehouse || []
    gardenData.warehouse.push({
      crop: plot.crop,
      harvestedAt: new Date().toISOString()
    })
    
    // 获得金币（作物价值的一半）
    const reward = Math.floor(cropConfig.value / 2)
    gardenData.coins = (gardenData.coins || 0) + reward
    
    // 清空格子
    gardenData.plots[plotIndex] = {
      id: plotIndex,
      crop: null,
      progress: 0,
      plantedAt: null
    }
    
    // 保存并渲染
    await saveGardenData()
    updateTip(`收获成功！获得 ${cropConfig.name} x1，金币 +${reward}`)
    render()
  }

  /**
   * 更新成长进度（由外部调用）
   * 在番茄钟运行期间，每分钟被调用一次
   */
  async function updateProgress() {
    // 每次都重新从数据库加载数据，确保获取最新状态
    await loadGardenData()
    
    const plots = gardenData.plots || []
    let hasChanges = false
    
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i]
      // 只有未锁定且有作物的格子才生长
      if (!plot.locked && plot.crop && plot.progress !== null) {
        const cropConfig = CROP_CONFIG[plot.crop]
        if (cropConfig) {
          // 成长进度+1分钟
          plot.progress += 1
          hasChanges = true
        }
      }
    }
    
    if (hasChanges) {
      await saveGardenData()
      // 通知菜园子页面刷新（如果页面已打开）
      if (window.electronAPI && window.electronAPI.refreshGarden) {
        window.electronAPI.refreshGarden()
      }
    }
  }

  /**
   * 处理重置惩罚（由外部调用）
   * 专注模式下重置计时器时，所有正在生长的作物枯萎死亡
   */
  async function handleResetPunishment() {
    // 每次都重新从数据库加载数据，确保获取最新状态
    await loadGardenData()
    
    const plots = gardenData.plots || []
    let hasDeadCrops = false
    
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i]
      // 未锁定且有未成熟作物的格子，作物枯萎
      if (!plot.locked && plot.crop && plot.progress !== null) {
        const cropConfig = CROP_CONFIG[plot.crop]
        if (cropConfig) {
          const progress = plot.progress
          const totalTime = cropConfig.growTime
          // 如果未成熟，作物枯萎
          if (progress < totalTime) {
            // 清空格子，作物死亡
            gardenData.plots[i] = {
              id: i,
              crop: null,
              progress: 0,
              plantedAt: null
            }
            hasDeadCrops = true
          }
        }
      }
    }
    
    if (hasDeadCrops) {
      await saveGardenData()
      // 只在花园页面打开时显示提示（检查元素是否存在）
      if (elements.gardenTip) {
        updateTip('⚠️ 专注模式中断！所有正在生长的作物已枯萎')
      }
      // 通知菜园子页面刷新（如果页面已打开）
      if (window.electronAPI && window.electronAPI.refreshGarden) {
        window.electronAPI.refreshGarden()
      }
    }
  }

  /**
   * 更新提示文字
   */
  function updateTip(message) {
    elements.gardenTip.textContent = message
  }

  // 导出到全局
  window.Garden = {
    init: init,
    updateProgress: updateProgress,
    handleResetPunishment: handleResetPunishment
  }

  // 页面加载完成后自动初始化
  document.addEventListener('DOMContentLoaded', init)
})()
