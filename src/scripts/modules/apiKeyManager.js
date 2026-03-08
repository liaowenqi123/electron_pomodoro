/**
 * API Key 管理模块 - 渲染进程
 * 处理API Key的UI交互
 */

const APIKeyManager = (function() {
  'use strict'

  let elements = {}
  let onSaveCallback = null

  /**
   * 初始化API Key管理器
   */
  function init(els) {
    elements = els
    bindEvents()
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 保存按钮
    if (elements.apiKeySave) {
      elements.apiKeySave.addEventListener('click', handleSave)
    }

    // 取消按钮
    if (elements.apiKeyCancel) {
      elements.apiKeyCancel.addEventListener('click', hideModal)
    }

    // 输入框回车键
    if (elements.apiKeyInput) {
      elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleSave()
        }
      })
    }
  }

  /**
   * 显示API Key配置弹窗
   */
  function showModal(currentKey = '') {
    if (elements.apiKeyModal) {
      elements.apiKeyModal.classList.add('show')
      if (elements.apiKeyInput) {
        elements.apiKeyInput.value = currentKey
        elements.apiKeyInput.focus()
      }
    }
  }

  /**
   * 隐藏API Key配置弹窗
   */
  function hideModal() {
    if (elements.apiKeyModal) {
      elements.apiKeyModal.classList.remove('show')
    }
  }

  /**
   * 处理保存
   */
  async function handleSave() {
    const apiKey = elements.apiKeyInput?.value.trim()
    
    if (!apiKey) {
      alert('请输入 API Key')
      return
    }

    // 简单验证格式
    if (!apiKey.startsWith('sk-')) {
      alert('API Key 格式不正确，应该以 sk- 开头')
      return
    }

    try {
      // 保存到数据存储
      const success = await window.electronAPI.saveApiKey(apiKey)
      
      if (success) {
        hideModal()
        
        // 显示成功提示
        if (window.DOM && window.DOM.statusEl) {
          window.DOM.statusEl.textContent = '✅ API Key 已保存'
          setTimeout(() => {
            window.DOM.statusEl.textContent = '准备开始专注工作'
          }, 2000)
        }

        // 调用回调
        if (onSaveCallback) {
          onSaveCallback(apiKey)
        }
      } else {
        alert('保存失败，请重试')
      }
    } catch (error) {
      console.error('保存API Key失败:', error)
      alert('保存失败：' + error.message)
    }
  }

  /**
   * 设置保存回调
   */
  function onSave(callback) {
    onSaveCallback = callback
  }

  /**
   * 检查并提示配置API Key
   */
  async function checkAndPrompt() {
    try {
      const apiKey = await window.electronAPI.getApiKey()
      
      if (!apiKey || apiKey === '<your api key>') {
        // 没有配置，显示弹窗
        showModal()
        return false
      }
      
      return true
    } catch (error) {
      console.error('检查API Key失败:', error)
      return false
    }
  }

  return {
    init,
    showModal,
    hideModal,
    onSave,
    checkAndPrompt
  }
})()

// 暴露到全局
window.APIKeyManager = APIKeyManager
