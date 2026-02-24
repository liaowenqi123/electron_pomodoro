/**
 * 番茄钟 - 教程弹窗模块
 */
;(function() {
  'use strict'

  function init() {
    // 打开弹窗
    DOM.tutorialBtn.addEventListener('click', () => {
      DOM.tutorialModal.classList.add('show')
    })

    // 关闭按钮
    DOM.tutorialClose.addEventListener('click', () => {
      DOM.tutorialModal.classList.remove('show')
    })

    // 点击遮罩层关闭
    DOM.tutorialModal.addEventListener('click', (e) => {
      if (e.target === DOM.tutorialModal) {
        DOM.tutorialModal.classList.remove('show')
      }
    })
  }

  // 导出到全局
  window.Tutorial = {
    init
  }
})()
