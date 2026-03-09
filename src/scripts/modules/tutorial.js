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
      closeTutorial()
    })

    // 点击遮罩层关闭
    DOM.tutorialModal.addEventListener('click', (e) => {
      if (e.target === DOM.tutorialModal) {
        closeTutorial()
      }
    })
  }

  function closeTutorial() {
    DOM.tutorialModal.classList.remove('show')
    DOM.tutorialModal.classList.add('hiding')
    
    setTimeout(() => {
      DOM.tutorialModal.classList.remove('hiding')
    }, 500)
  }

  // 导出到全局
  window.Tutorial = {
    init
  }
})()
