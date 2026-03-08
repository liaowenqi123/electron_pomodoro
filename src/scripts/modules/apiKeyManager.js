/**
 * 云端登录管理模块 - 渲染进程
 * 处理用户登录/注册和 API Key 获取
 * 支持记住密码和自动登录
 */

const CloudAuth = (function() {
  'use strict'

  let elements = {}
  let onLoginCallback = null
  let currentDeepseekKey = null  // 内存中保存 API Key
  let isAutoLoggingIn = false    // 是否正在自动登录

  /**
   * 初始化
   */
  async function init() {
    bindElements()
    bindEvents()
    testConnection()
    
    // 尝试自动登录
    const autoLoggedIn = await tryAutoLogin()
    
    // 如果没有自动登录，检查现有会话
    if (!autoLoggedIn) {
      await checkSession()
    }
  }

  /**
   * 绑定元素
   */
  function bindElements() {
    elements = {
      modal: document.getElementById('loginModal'),
      modalClose: document.getElementById('loginModalClose'),
      authPanel: document.getElementById('authPanel'),
      loggedInPanel: document.getElementById('loggedInPanel'),
      welcomeText: document.getElementById('welcomeText'),
      userMetaText: document.getElementById('userMetaText'),
      connectionStatus: document.getElementById('connectionStatus'),
      authMessage: document.getElementById('authMessage'),
      // 登录表单
      loginUsername: document.getElementById('loginUsername'),
      loginPassword: document.getElementById('loginPassword'),
      rememberPassword: document.getElementById('rememberPassword'),
      autoLogin: document.getElementById('autoLogin'),
      loginBtn: document.getElementById('loginBtn'),
      // 注册表单
      registerUsername: document.getElementById('registerUsername'),
      registerPassword: document.getElementById('registerPassword'),
      registerBtn: document.getElementById('registerBtn'),
      // 退出按钮
      logoutBtn: document.getElementById('logoutBtn'),
      // 顶部登录按钮
      loginHeaderBtn: document.getElementById('loginBtn2')
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 顶部登录按钮
    if (elements.loginHeaderBtn) {
      elements.loginHeaderBtn.addEventListener('click', showModal)
    }

    // 关闭按钮
    if (elements.modalClose) {
      elements.modalClose.addEventListener('click', hideModal)
    }

    // Tab 切换
    document.querySelectorAll('.login-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        
        const tabName = tab.dataset.tab
        document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'))
        document.getElementById(tabName + 'FormPanel').classList.add('active')
        
        hideMessage()
      })
    })

    // 登录按钮
    if (elements.loginBtn) {
      elements.loginBtn.addEventListener('click', handleLogin)
    }

    // 注册按钮
    if (elements.registerBtn) {
      elements.registerBtn.addEventListener('click', handleRegister)
    }

    // 退出登录按钮
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', handleLogout)
    }

    // 回车键登录
    if (elements.loginPassword) {
      elements.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin()
      })
    }

    // 回车键注册
    if (elements.registerPassword) {
      elements.registerPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister()
      })
    }

    // 点击遮罩层关闭（仅非自动登录时可关闭）
    if (elements.modal) {
      elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal && !isAutoLoggingIn) {
          hideModal()
        }
      })
    }
    
    // 自动登录复选框联动
    if (elements.autoLogin) {
      elements.autoLogin.addEventListener('change', () => {
        if (elements.autoLogin.checked && elements.rememberPassword) {
          elements.rememberPassword.checked = true
        }
      })
    }
    
    // 取消记住密码时取消自动登录
    if (elements.rememberPassword) {
      elements.rememberPassword.addEventListener('change', () => {
        if (!elements.rememberPassword.checked && elements.autoLogin) {
          elements.autoLogin.checked = false
        }
      })
    }
  }

  /**
   * 测试连接
   */
  async function testConnection() {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.cloudTestConnection()
      if (result.success) {
        elements.connectionStatus.textContent = '● 已连接'
        elements.connectionStatus.className = 'connection-status connected'
      } else {
        elements.connectionStatus.textContent = '● 连接失败'
        elements.connectionStatus.className = 'connection-status disconnected'
      }
    } catch (err) {
      elements.connectionStatus.textContent = '● 连接失败'
      elements.connectionStatus.className = 'connection-status disconnected'
    }
  }

  /**
   * 尝试自动登录
   * @returns {boolean} 是否成功自动登录
   */
  async function tryAutoLogin() {
    if (!window.electronAPI) return false

    try {
      // 加载保存的凭据
      const result = await window.electronAPI.loadCredentials()
      if (!result.success || !result.credentials) {
        return false
      }

      const { username, password, autoLogin: savedAutoLogin } = result.credentials

      // 检查是否启用了自动登录
      if (!savedAutoLogin || !username || !password) {
        // 如果有保存的用户名密码但没有自动登录，填充表单
        if (username && password) {
          elements.loginUsername.value = username
          elements.loginPassword.value = password
          elements.rememberPassword.checked = true
          elements.autoLogin.checked = savedAutoLogin || false
        }
        return false
      }

      // 执行自动登录
      isAutoLoggingIn = true
      console.log('[CloudAuth] 尝试自动登录:', username)

      const loginResult = await window.electronAPI.cloudLogin({ username, password })

      if (loginResult.success) {
        console.log('[CloudAuth] 自动登录成功')
        currentDeepseekKey = loginResult.deepseekKey
        
        // 更新 UI
        showLoggedInPanel(loginResult.user, loginResult.deepseekKey)
        
        // 调用回调
        if (onLoginCallback) {
          onLoginCallback(loginResult.user, loginResult.deepseekKey)
        }
        
        return true
      } else {
        console.log('[CloudAuth] 自动登录失败:', loginResult.error)
        // 自动登录失败，显示登录界面并填充用户名密码
        elements.loginUsername.value = username
        elements.loginPassword.value = password
        elements.rememberPassword.checked = true
        elements.autoLogin.checked = false
        
        // 显示登录弹窗
        showModal()
        showMessage('自动登录失败，请重新登录', 'error')
        
        // 清除无效凭据
        await window.electronAPI.clearCredentials()
        
        return false
      }
    } catch (err) {
      console.error('[CloudAuth] 自动登录异常:', err)
      return false
    } finally {
      isAutoLoggingIn = false
    }
  }

  /**
   * 检查会话
   */
  async function checkSession() {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.cloudGetSession()
      if (result.success && result.session) {
        showLoggedInPanel(result.session)
        // 获取 API Key（内存中）
        currentDeepseekKey = result.deepseekKey
      } else {
        // 没有会话，检查是否有保存的凭据
        const credResult = await window.electronAPI.loadCredentials()
        if (credResult.success && credResult.credentials) {
          const { username, password, autoLogin } = credResult.credentials
          if (username) elements.loginUsername.value = username
          if (password) elements.loginPassword.value = password
          if (password) elements.rememberPassword.checked = true
          if (autoLogin) elements.autoLogin.checked = autoLogin
        }
        // 显示登录弹窗
        showModal()
      }
    } catch (err) {
      console.error('检查会话失败:', err)
      showModal()
    }
  }

  /**
   * 显示弹窗
   */
  function showModal() {
    if (elements.modal) {
      elements.modal.classList.add('show')
    }
  }

  /**
   * 隐藏弹窗
   */
  function hideModal() {
    if (elements.modal) {
      elements.modal.classList.remove('show')
    }
  }

  /**
   * 显示消息
   */
  function showMessage(text, type) {
    if (elements.authMessage) {
      elements.authMessage.textContent = text
      elements.authMessage.className = 'login-message ' + type
    }
  }

  /**
   * 隐藏消息
   */
  function hideMessage() {
    if (elements.authMessage) {
      elements.authMessage.className = 'login-message'
    }
  }

  /**
   * 显示登录面板
   */
  function showAuthPanel() {
    elements.authPanel.style.display = 'block'
    elements.loggedInPanel.style.display = 'none'
  }

  /**
   * 显示已登录面板
   */
  function showLoggedInPanel(user, deepseekKey = null) {
    elements.authPanel.style.display = 'none'
    elements.loggedInPanel.style.display = 'block'
    
    elements.welcomeText.textContent = `欢迎, ${user.username}!`
    
    let metaText = `ID: ${user.id}`
    if (user.admin) {
      metaText += ' | 👑 Admin'
    }
    elements.userMetaText.textContent = metaText

    // 保存 API Key 到内存（不显示）
    currentDeepseekKey = deepseekKey

    // 更新顶部按钮
    if (elements.loginHeaderBtn) {
      elements.loginHeaderBtn.textContent = '👤'
      elements.loginHeaderBtn.title = user.username
    }
    
    // 隐藏弹窗
    hideModal()
  }

  /**
   * 处理登录
   */
  async function handleLogin() {
    const username = elements.loginUsername?.value.trim()
    const password = elements.loginPassword?.value
    const rememberPassword = elements.rememberPassword?.checked
    const autoLogin = elements.autoLogin?.checked

    if (!username || !password) {
      showMessage('请填写所有字段', 'error')
      return
    }

    elements.loginBtn.disabled = true
    elements.loginBtn.textContent = '登录中...'

    try {
      const result = await window.electronAPI.cloudLogin({ username, password })

      if (result.success) {
        showMessage('登录成功！', 'success')
        showLoggedInPanel(result.user, result.deepseekKey)
        
        // 保存凭据（如果勾选了记住密码）
        if (rememberPassword) {
          await window.electronAPI.saveCredentials({
            username,
            password,
            autoLogin: autoLogin
          })
        } else {
          // 清除之前保存的凭据
          await window.electronAPI.clearCredentials()
        }
        
        // 调用回调
        if (onLoginCallback) {
          onLoginCallback(result.user, result.deepseekKey)
        }
      } else {
        showMessage('登录失败: ' + result.error, 'error')
      }
    } catch (err) {
      showMessage('登录失败: ' + err.message, 'error')
    } finally {
      elements.loginBtn.disabled = false
      elements.loginBtn.textContent = '登录'
    }
  }

  /**
   * 处理注册
   */
  async function handleRegister() {
    const username = elements.registerUsername?.value.trim()
    const password = elements.registerPassword?.value

    if (!username || !password) {
      showMessage('请填写所有字段', 'error')
      return
    }

    if (username.length < 2) {
      showMessage('用户名至少需要2个字符', 'error')
      return
    }

    if (password.length < 6) {
      showMessage('密码至少需要6位', 'error')
      return
    }

    elements.registerBtn.disabled = true
    elements.registerBtn.textContent = '注册中...'

    try {
      const result = await window.electronAPI.cloudRegister({ username, password })

      if (result.success) {
        showMessage('注册成功！请登录', 'success')
        // 切换到登录 Tab
        document.querySelector('.login-tab[data-tab="login"]').click()
        elements.loginUsername.value = username
        elements.loginPassword.focus()
      } else {
        showMessage('注册失败: ' + result.error, 'error')
      }
    } catch (err) {
      showMessage('注册失败: ' + err.message, 'error')
    } finally {
      elements.registerBtn.disabled = false
      elements.registerBtn.textContent = '注册'
    }
  }

  /**
   * 处理退出登录
   */
  async function handleLogout() {
    // 检查番茄钟是否在运行
    if (window.Timer && window.Timer.getIsRunning && window.Timer.getIsRunning()) {
      showMessage('请先停止番茄钟再退出登录', 'error')
      return
    }
    
    // 检查前台检测是否在运行
    if (window.ForegroundDetection && window.ForegroundDetection.getIsDetecting && window.ForegroundDetection.getIsDetecting()) {
      showMessage('前台检测正在运行，请稍后再试', 'error')
      return
    }
    
    try {
      await window.electronAPI.cloudLogout()
      currentDeepseekKey = null
      showAuthPanel()
      
      // 清除保存的凭据
      await window.electronAPI.clearCredentials()
      
      // 清空表单
      elements.loginUsername.value = ''
      elements.loginPassword.value = ''
      elements.rememberPassword.checked = false
      elements.autoLogin.checked = false
      elements.registerUsername.value = ''
      elements.registerPassword.value = ''
      
      // 更新顶部按钮
      if (elements.loginHeaderBtn) {
        elements.loginHeaderBtn.textContent = '☁️'
        elements.loginHeaderBtn.title = '云端登录'
      }
      
      // 显示登录弹窗
      showModal()
    } catch (err) {
      console.error('退出登录失败:', err)
    }
  }

  /**
   * 设置登录回调
   */
  function onLogin(callback) {
    onLoginCallback = callback
  }

  /**
   * 检查是否已登录
   */
  async function isLoggedIn() {
    if (!window.electronAPI) return false
    
    try {
      const result = await window.electronAPI.cloudGetSession()
      return result.success && result.session
    } catch {
      return false
    }
  }

  /**
   * 获取当前 API Key（内存中）
   */
  function getApiKey() {
    return currentDeepseekKey
  }

  /**
   * 检查是否有有效的 API Key
   */
  function hasApiKey() {
    return currentDeepseekKey !== null
  }

  return {
    init,
    showModal,
    hideModal,
    onLogin,
    isLoggedIn,
    getApiKey,
    hasApiKey
  }
})()

// 暴露到全局
window.CloudAuth = CloudAuth
