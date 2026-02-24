/**
 * 预设管理模块
 */
;(function() {
  'use strict'

  let elements = {}
  let callbacks = {}
  let currentPresets = { work: [], break: [] }
  let currentMode = 'work'
  let activePreset = null
  let isEnabled = true

  // 默认预设（首次加载时使用）
  const defaultPresets = {
    work: [15, 25, 45, 60],
    break: [5, 10, 15]
  }

  // 渲染预设列表
  function render() {
    const presets = currentPresets[currentMode] || []
    
    elements.presetList.innerHTML = ''
    
    presets.forEach((minutes, index) => {
      const item = document.createElement('div')
      item.className = 'preset-item'
      item.dataset.minutes = minutes
      
      if (!isEnabled) {
        item.classList.add('disabled')
      }
      
      if (activePreset === minutes) {
        item.classList.add('active')
      }
      
      item.innerHTML = `
        <span class="preset-time">${minutes}分钟</span>
        <button class="preset-delete">×</button>
      `
      
      // 点击选择预设
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('preset-delete')) return
        if (!isEnabled) return
        
        selectPreset(minutes)
      })
      
      // 删除按钮
      const deleteBtn = item.querySelector('.preset-delete')
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        deletePreset(minutes)
      })
      
      elements.presetList.appendChild(item)
    })
  }

  // 选择预设
  function selectPreset(minutes) {
    activePreset = minutes
    
    // 更新 UI
    document.querySelectorAll('.preset-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.minutes) === minutes)
    })
    
    // 触发回调
    if (callbacks.onSelect) {
      callbacks.onSelect(minutes)
    }
  }

  // 添加预设
  async function addPreset(minutes) {
    // 验证
    minutes = parseInt(minutes)
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      return false
    }
    
    // 检查是否已存在
    if (currentPresets[currentMode].includes(minutes)) {
      return false
    }
    
    // 添加并排序
    currentPresets[currentMode].push(minutes)
    currentPresets[currentMode].sort((a, b) => a - b)
    
    // 保存
    await DataStore.updatePresets(currentPresets)
    
    // 重新渲染
    render()
    
    // 自动选中新预设
    selectPreset(minutes)
    
    return true
  }

  // 删除预设
  async function deletePreset(minutes) {
    // 删除
    const index = currentPresets[currentMode].indexOf(minutes)
    if (index > -1) {
      currentPresets[currentMode].splice(index, 1)
    }
    
    // 保存
    await DataStore.updatePresets(currentPresets)
    
    // 如果删除的是当前选中的，取消选中
    if (activePreset === minutes) {
      activePreset = null
    }
    
    // 重新渲染
    render()
    
    return true
  }

  // 设置当前模式
  function setMode(mode) {
    currentMode = mode
    activePreset = null
    render()
  }

  // 设置启用状态
  function setEnabled(enabled) {
    isEnabled = enabled
    render()
    
    // 禁用滚轮选择器
    if (elements.wheelPickerEl) {
      if (enabled) {
        elements.wheelPickerEl.classList.remove('disabled')
      } else {
        elements.wheelPickerEl.classList.add('disabled')
      }
    }
    // 禁用添加按钮
    if (elements.addPresetBtn) {
      elements.addPresetBtn.disabled = !enabled
    }
  }

  // 获取当前选中的预设
  function getActivePreset() {
    return activePreset
  }

  // 初始化
  async function init(els, cbs) {
    elements = els
    callbacks = cbs || {}
    
    // 加载预设数据
    const presets = DataStore.getPresets()
    if (presets && (presets.work?.length > 0 || presets.break?.length > 0)) {
      currentPresets = { ...presets }
    } else {
      currentPresets = { ...defaultPresets }
    }
    
    // 初始渲染
    render()
  }

  // 导出到全局
  window.Presets = {
    init: init,
    render: render,
    selectPreset: selectPreset,
    addPreset: addPreset,
    deletePreset: deletePreset,
    setMode: setMode,
    setEnabled: setEnabled,
    getActivePreset: getActivePreset
  }
})()
