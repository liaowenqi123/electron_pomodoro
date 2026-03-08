/**
 * 备注管理模块
 */
;(function() {
  'use strict'

  let elements = {}
  let currentNote = { title: '', detail: '' } // 内存存储

  // 显示编辑模态框
  function showEditModal(callback) {
    // 填充现有备注（如果有）
    document.getElementById('noteTitleInput').value = currentNote.title || ''
    document.getElementById('noteDetailInput').value = currentNote.detail || ''
    
    const modal = document.getElementById('noteEditModal')
    modal.classList.add('show')

    // 取消按钮
    const cancelBtn = document.getElementById('noteCancelBtn')
    const saveBtn = document.getElementById('noteSaveBtn')
    const closeHandler = () => {
      modal.classList.remove('show')
      cleanup()
    }
    const saveHandler = () => {
      const title = document.getElementById('noteTitleInput').value.trim()
      if (!title) {
        alert('标题不能为空')
        return
      }
      const detail = document.getElementById('noteDetailInput').value.trim()
      currentNote = { title, detail }
      modal.classList.remove('show')
      if (callback) callback(currentNote)
      cleanup()
    }
    const cleanup = () => {
      cancelBtn.removeEventListener('click', closeHandler)
      saveBtn.removeEventListener('click', saveHandler)
      modal.removeEventListener('click', overlayHandler)
    }
    const overlayHandler = (e) => {
      if (e.target === modal) {
        closeHandler()
      }
    }
    cancelBtn.addEventListener('click', closeHandler)
    saveBtn.addEventListener('click', saveHandler)
    modal.addEventListener('click', overlayHandler)
  }

  // 显示查看模态框
  function showViewModal() {
    if (!currentNote.title) return
    document.getElementById('viewNoteTitle').textContent = currentNote.title
    document.getElementById('viewNoteDetail').textContent = currentNote.detail || '（无详细备注）'
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

  // 更新备注按钮显示
function updateNoteButton() {
  const container = document.getElementById('noteButtonContainer')
  const btn = document.getElementById('showNoteBtn')
  if (currentNote.title) {
    container.style.display = 'block'
    let displayTitle = currentNote.title.length > 15 ? currentNote.title.slice(0, 12) + '...' : currentNote.title
    btn.textContent = '📝 ' + displayTitle   
  } else {
    container.style.display = 'none'
  }
}

  // 清除当前备注
  function clearNote() {
    currentNote = { title: '', detail: '' }
    updateNoteButton()
  }

  // 获取当前备注（用于外部）
  function getNote() {
    return { ...currentNote }
  }

  // 设置备注（用于恢复等）
  function setNote(note) {
    currentNote = { title: note.title || '', detail: note.detail || '' }
    updateNoteButton()
  }

  // 初始化
  function init() {
    // 绑定查看按钮事件
    document.getElementById('showNoteBtn').addEventListener('click', showViewModal)
    // 初始隐藏
    document.getElementById('noteButtonContainer').style.display = 'none'
  }

  // 导出
  window.NoteManager = {
    init,
    showEditModal,
    showViewModal,
    clearNote,
    getNote,
    setNote,
    updateNoteButton
  }
})()
