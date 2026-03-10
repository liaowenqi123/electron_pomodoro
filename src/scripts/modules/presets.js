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

  // 使用统一的默认预设
  const defaultPresets = Utils.DEFAULT_PRESETS

  // 渲染预设列表
  function render() {
    const presets = currentPresets[currentMode] || []
    
    elements.presetList.innerHTML = ''
    
    presets.forEach((preset, index) => {
      // 兼容旧格式（纯数字）和新格式（对象）
      const minutes = typeof preset === 'number' ? preset : preset.minutes
      const note = typeof preset === 'object' ? preset.note : null
      
      const item = document.createElement('div')
      item.className = 'preset-item'
      item.dataset.minutes = minutes
      item.dataset.index = index
      
      if (!isEnabled) {
        item.classList.add('disabled')
      }
      
      if (activePreset === minutes) {
        item.classList.add('active')
      }
      
      // 构建左侧内容（只显示时间，不显示备注图标）
      let leftContent = `<span class="preset-time">${minutes}分钟</span>`
      
      // 总是显示删除按钮
      const deleteBtnHtml = `<button class="preset-delete" data-index="${index}">×</button>`
      
      item.innerHTML = `
        <div class="preset-item-left">
          ${leftContent}
        </div>
        ${deleteBtnHtml}
      `
      
      // 点击选择预设
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('preset-delete')) return
        if (!isEnabled) return
        
        selectPreset(minutes, note, index)
      })
      
      // 删除按钮
      const deleteBtn = item.querySelector('.preset-delete')
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          const idx = parseInt(e.target.dataset.index)
          deletePreset(idx)
        })
      }
      
      elements.presetList.appendChild(item)
    })
  }

  // 编辑预设的备注
  function editNoteForPreset(index, currentNote) {
    // 填充当前备注到弹窗
    const modal = document.getElementById('noteViewModal')
    const contentDiv = modal.querySelector('.note-view')
    const closeBtn = document.getElementById('noteViewCloseBtn')
    
    // 改为可编辑的输入框
    contentDiv.innerHTML = `
      <input type="text" id="editNoteTitleInput" class="edit-note-input" placeholder="标题（可选）" value="${currentNote?.title || ''}" maxlength="50">
      <textarea id="editNoteDetailInput" class="edit-note-textarea" placeholder="详细内容（可选）" rows="4">${currentNote?.detail || ''}</textarea>
    `
    
    // 修改标题
    const titleEl = modal.querySelector('h3')
    titleEl.textContent = '编辑备注'
    
    // 添加关闭按钮
    let closeX = modal.querySelector('.note-modal-close')
    if (!closeX) {
      closeX = document.createElement('button')
      closeX.className = 'note-modal-close'
      closeX.innerHTML = '×'
      modal.querySelector('.note-modal-content').insertBefore(closeX, titleEl)
    }
    
    // 修改按钮容器
    const buttonsContainer = closeBtn.parentElement
    buttonsContainer.innerHTML = `
      <button class="btn-note-delete" id="noteDeleteBtn" style="display: ${(currentNote && (currentNote.title || currentNote.detail)) ? 'inline-block' : 'none'}">删除备注</button>
      <button class="btn-note-save" id="noteSaveBtn">保存</button>
    `
    
    modal.classList.add('show')

    const saveBtn = document.getElementById('noteSaveBtn')
    const deleteBtn = document.getElementById('noteDeleteBtn')
    
    const saveHandler = async () => {
      const titleInput = document.getElementById('editNoteTitleInput')
      const detailInput = document.getElementById('editNoteDetailInput')
      const newTitle = titleInput.value.trim()
      const newDetail = detailInput.value.trim()
      
      // 如果标题和详细内容都为空，删除备注
      const newNote = (newTitle || newDetail) ? { title: newTitle, detail: newDetail } : null
      
      // 更新预设的备注
      await updatePresetNote(index, newNote)
      
      modal.classList.remove('show')
      cleanup()
    }
    
    const deleteNoteHandler = async () => {
      if (confirm('确定要删除这条备注吗？')) {
        await updatePresetNote(index, null)
        modal.classList.remove('show')
        cleanup()
      }
    }
    
    const closeHandler = () => {
      modal.classList.remove('show')
      cleanup()
    }
    
    const overlayHandler = (e) => {
      if (e.target === modal) {
        closeHandler()
      }
    }
    
    const cleanup = () => {
      saveBtn.removeEventListener('click', saveHandler)
      deleteBtn.removeEventListener('click', deleteNoteHandler)
      closeX.removeEventListener('click', closeHandler)
      modal.removeEventListener('click', overlayHandler)
      // 恢复原始状态
      titleEl.textContent = '备注详情'
      closeX.remove()
      buttonsContainer.innerHTML = '<button class="btn-note-close" id="noteViewCloseBtn">关闭</button>'
    }
    
    saveBtn.addEventListener('click', saveHandler)
    deleteBtn.addEventListener('click', deleteNoteHandler)
    closeX.addEventListener('click', closeHandler)
    modal.addEventListener('click', overlayHandler)
  }

  // 更新预设的备注
  async function updatePresetNote(index, newNote) {
    if (index >= 0 && index < currentPresets[currentMode].length) {
      const preset = currentPresets[currentMode][index]
      const minutes = typeof preset === 'number' ? preset : preset.minutes
      
      if (newNote) {
        // 更新备注
        currentPresets[currentMode][index] = { minutes, note: newNote }
      } else {
        // 删除备注，转回纯数字格式
        currentPresets[currentMode][index] = minutes
      }
      
      // 保存
      await DataStore.updatePresets(currentPresets)
      
      // 重新渲染
      render()
    }
  }

  // 显示备注详情（只读）
  function showNoteDetail(note) {
    if (!note || (!note.title && !note.detail)) return
    const titleEl = document.getElementById('viewNoteTitle')
    const detailEl = document.getElementById('viewNoteDetail')
    
    titleEl.textContent = note.title || '（无标题）'
    detailEl.textContent = note.detail || '（无详细备注）'
    
    const modal = document.getElementById('noteViewModal')
    modal.classList.add('show')

    const closeBtn = document.getElementById('noteViewCloseBtn')
    const closeHandler = () => {
      modal.classList.remove('show')
      cleanup()
    }
    const overlayHandler = (e) => {
      if (e.target === modal) {
        closeHandler()
      }
    }
    const cleanup = () => {
      closeBtn.removeEventListener('click', closeHandler)
      modal.removeEventListener('click', overlayHandler)
    }
    closeBtn.addEventListener('click', closeHandler)
    modal.addEventListener('click', overlayHandler)
  }

  // 选择预设
  function selectPreset(minutes, note, index) {
    activePreset = minutes
    
    // 更新 UI
    document.querySelectorAll('.preset-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.minutes) === minutes)
    })
    
    // 只在单次模式时显示计时器上方的备注
    if (AppState.appMode === 'single') {
      const timerNoteInput = document.getElementById('timerNoteInput')
      const timerNoteDisplay = document.getElementById('timerNoteDisplay')
      const timerNoteTitleInput = document.getElementById('timerNoteTitleInput')
      const timerNoteText = document.getElementById('timerNoteText')
      
      if (timerNoteInput && timerNoteDisplay) {
        // 如果已有备注，显示备注文本
        if (note && note.title) {
          timerNoteInput.style.display = 'none'
          timerNoteDisplay.style.display = 'flex'
          timerNoteText.textContent = note.title
        } else {
          // 没有备注，显示空的笔emoji
          timerNoteInput.style.display = 'none'
          timerNoteDisplay.style.display = 'flex'
          timerNoteText.textContent = ''
        }
      }
    } else {
      // 计划模式时隐藏备注
      const timerNoteInput = document.getElementById('timerNoteInput')
      const timerNoteDisplay = document.getElementById('timerNoteDisplay')
      if (timerNoteInput) timerNoteInput.style.display = 'none'
      if (timerNoteDisplay) timerNoteDisplay.style.display = 'none'
    }
    
    // 触发回调
    if (callbacks.onSelect) {
      callbacks.onSelect(minutes)
    }
  }
  
  // 绑定确认按钮事件
  function bindConfirmButton(index) {
    const confirmBtn = document.getElementById('timerNoteConfirm')
    const timerNoteInput = document.getElementById('timerNoteInput')
    const timerNoteDisplay = document.getElementById('timerNoteDisplay')
    const timerNoteTitleInput = document.getElementById('timerNoteTitleInput')
    const timerNoteText = document.getElementById('timerNoteText')
    
    if (!confirmBtn) return
    
    // 清除旧的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true)
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn)
    
    const updatedConfirmBtn = document.getElementById('timerNoteConfirm')
    
    const handleConfirm = async (e) => {
      e.preventDefault()
      e.stopPropagation()
      const title = timerNoteTitleInput.value.trim()
      const newNote = title ? { title, detail: '' } : null
      
      // 更新预设的备注
      await updatePresetNote(index, newNote)
      
      // 切换到显示模式
      timerNoteInput.style.display = 'none'
      timerNoteDisplay.style.display = 'flex'
      timerNoteText.textContent = title
    }
    
    updatedConfirmBtn.addEventListener('click', handleConfirm)
    
    // 绑定回车键
    timerNoteTitleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        updatedConfirmBtn.click()
      }
    })
  }

  // 重新初始化当前模式的备注显示
  function reinitializeNoteDisplay() {
    const currentMode = Mode.getMode()
    const timerNoteInput = document.getElementById('timerNoteInput')
    const timerNoteDisplay = document.getElementById('timerNoteDisplay')
    const timerNoteText = document.getElementById('timerNoteText')
    
    if (!timerNoteInput || !timerNoteDisplay) return
    
    // 如果有选中的预设，显示其备注
    if (activePreset !== null) {
      const index = currentPresets[currentMode].findIndex(preset => {
        const presetMinutes = typeof preset === 'number' ? preset : preset.minutes
        return presetMinutes === activePreset
      })
      
      if (index >= 0) {
        const preset = currentPresets[currentMode][index]
        const note = typeof preset === 'object' ? preset.note : null
        
        timerNoteInput.style.display = 'none'
        timerNoteDisplay.style.display = 'flex'
        timerNoteText.textContent = note && note.title ? note.title : ''
        return
      }
    }
    
    // 没有选中的预设，隐藏备注
    timerNoteInput.style.display = 'none'
    timerNoteDisplay.style.display = 'none'
  }
  
  // 添加预设
  async function addPreset(minutes, note) {
    // 验证
    minutes = parseInt(minutes)
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      return false
    }
    
    // 单次模式下不允许添加相同时间的预设
    const exists = currentPresets[currentMode].some(preset => {
      const presetMinutes = typeof preset === 'number' ? preset : preset.minutes
      return presetMinutes === minutes
    })
    
    if (exists) {
      showToast('该时间预设已存在')
      return false
    }
    
    // 添加新预设
    currentPresets[currentMode].push({ minutes, note })
    
    // 排序
    currentPresets[currentMode].sort((a, b) => {
      const aMin = typeof a === 'number' ? a : a.minutes
      const bMin = typeof b === 'number' ? b : b.minutes
      return aMin - bMin
    })
    
    // 保存
    await DataStore.updatePresets(currentPresets)
    
    // 重新渲染
    render()
    
    // 自动选中新预设
    const index = currentPresets[currentMode].findIndex(preset => {
      const presetMinutes = typeof preset === 'number' ? preset : preset.minutes
      return presetMinutes === minutes
    })
    selectPreset(minutes, note, index)
    
    return true
  }
  
  // 显示提示信息
  function showToast(message) {
    const toast = document.getElementById('toastNotification')
    if (!toast) return
    
    toast.textContent = message
    toast.classList.add('show')
    
    // 0.7秒后自动消失
    setTimeout(() => {
      toast.classList.remove('show')
    }, 700)
  }

  // 删除预设
  async function deletePreset(index) {
    // 使用索引删除，而不是时间
    if (index >= 0 && index < currentPresets[currentMode].length) {
      currentPresets[currentMode].splice(index, 1)
    }
    
    // 保存
    await DataStore.updatePresets(currentPresets)
    
    // 取消选中
    activePreset = null
    
    // 隐藏备注输入框和显示区域
    const timerNoteInput = document.getElementById('timerNoteInput')
    const timerNoteDisplay = document.getElementById('timerNoteDisplay')
    if (timerNoteInput) timerNoteInput.style.display = 'none'
    if (timerNoteDisplay) timerNoteDisplay.style.display = 'none'
    
    // 如果没有预设了，显示00:00
    if (currentPresets[currentMode].length === 0) {
      Timer.setTime(0)
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
  
  // 初始化笔emoji的点击事件
  function initializeNoteEditButton() {
    const editBtn = document.getElementById('timerNoteEditBtn')
    if (!editBtn) return
    
    // 清除旧的事件监听器
    const newEditBtn = editBtn.cloneNode(true)
    editBtn.parentNode.replaceChild(newEditBtn, editBtn)
    
    const updatedEditBtn = document.getElementById('timerNoteEditBtn')
    updatedEditBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const timerNoteInput = document.getElementById('timerNoteInput')
      const timerNoteDisplay = document.getElementById('timerNoteDisplay')
      const timerNoteTitleInput = document.getElementById('timerNoteTitleInput')
      
      // 获取当前选中的预设
      const activeMinutes = activePreset
      
      // 如果没有选择预设，不做任何操作
      if (activeMinutes === null) {
        return
      }
      
      // 获取当前预设的索引
      const currentMode = Mode.getMode()
      const index = currentPresets[currentMode].findIndex(preset => {
        const presetMinutes = typeof preset === 'number' ? preset : preset.minutes
        return presetMinutes === activeMinutes
      })
      
      if (index < 0) return
      
      const preset = currentPresets[currentMode][index]
      const note = typeof preset === 'object' ? preset.note : null
      
      timerNoteDisplay.style.display = 'none'
      timerNoteInput.style.display = 'flex'
      timerNoteTitleInput.value = note && note.title ? note.title : ''
      timerNoteTitleInput.focus()
      bindConfirmButton(index)
    })
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
    getActivePreset: getActivePreset,
    initializeNoteEditButton: initializeNoteEditButton,
    reinitializeNoteDisplay: reinitializeNoteDisplay
  }
})()
