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
      
      // 构建左侧内容（时间 + 备注图标）
      let leftContent = `<span class="preset-time">${minutes}分钟</span>`
      if (note && (note.title || note.detail)) {
        const tooltipText = note.title || '查看备注'
        leftContent += `
          <span class="preset-note-icon" data-index="${index}" title="${tooltipText}">
            📒
          </span>
        `
      }
      
      item.innerHTML = `
        <div class="preset-item-left">
          ${leftContent}
        </div>
        <button class="preset-delete" data-index="${index}">×</button>
      `
      
      // 点击选择预设
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('preset-delete')) return
        if (e.target.classList.contains('preset-note-icon')) {
          // 点击备注图标，显示编辑备注弹窗
          e.stopPropagation()
          const idx = parseInt(e.target.dataset.index)
          editNoteForPreset(idx, note)
          return
        }
        if (!isEnabled) return
        
        selectPreset(minutes, note)
      })
      
      // 删除按钮
      const deleteBtn = item.querySelector('.preset-delete')
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const idx = parseInt(e.target.dataset.index)
        deletePreset(idx)
      })
      
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
  function selectPreset(minutes, note) {
    activePreset = minutes
    
    // 更新 UI
    document.querySelectorAll('.preset-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.minutes) === minutes)
    })
    
    // 如果预设有备注，填充到备注输入框（可选）
    if (note && window.NoteManager) {
      window.NoteManager.setNote(note)
    } else {
      // 如果没有备注，清空输入框
      window.NoteManager.clearNote()
    }
    
    // 触发回调
    if (callbacks.onSelect) {
      callbacks.onSelect(minutes)
    }
  }

  // 添加预设
  async function addPreset(minutes, note) {
    // 验证
    minutes = parseInt(minutes)
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      return false
    }
    
    // 允许添加相同时间的预设，不再检查是否已存在
    // 直接添加新预设
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
    selectPreset(minutes, note)
    
    return true
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
