/**
 * 统计模块 - 数据可视化
 */

const Statistics = (function() {
  'use strict'

  let elements = {}
  let currentPeriod = 'daily' // daily, weekly, monthly
  let currentChartType = 'bar' // bar, line, pie
  let chartInstance = null

  /**
   * 初始化统计模块
   */
  function init(els) {
    elements = els
    bindEvents()
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 统计按钮点击
    if (elements.statsBtn) {
      console.log('统计按钮已找到，绑定事件')
      elements.statsBtn.addEventListener('click', showStatsModal)
    } else {
      console.error('统计按钮未找到')
    }

    // 关闭弹窗
    if (elements.statsModalClose) {
      elements.statsModalClose.addEventListener('click', hideStatsModal)
    }

    // 点击背景关闭
    if (elements.statsModal) {
      elements.statsModal.addEventListener('click', (e) => {
        if (e.target === elements.statsModal) {
          hideStatsModal()
        }
      })
    }

    // 时间范围切换
    const periodBtns = document.querySelectorAll('.stats-period-btn')
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        currentPeriod = btn.dataset.period
        updateOverview()
        updateChart()
        updateDetailsTable()
      })
    })

    // 图表类型切换
    const chartBtns = document.querySelectorAll('.stats-chart-btn')
    chartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chartBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        currentChartType = btn.dataset.chart
        updateChart()
      })
    })
  }

  /**
   * 显示统计弹窗
   */
  function showStatsModal() {
    if (elements.statsModal) {
      elements.statsModal.classList.add('show')
      
      // 同步当前数据到历史记录
      syncCurrentDataToHistory()
      
      updateOverview()
      updateChart()
      updateDetailsTable()
    }
  }

  /**
   * 同步当前统计数据到历史记录
   */
  function syncCurrentDataToHistory() {
    const stats = DataStore.getStats()
    const data = DataStore.getData()
    const today = new Date().toISOString().split('T')[0]
    
    // 如果今天有统计数据
    if (stats.todayCount > 0) {
      if (!data.statisticsHistory) {
        data.statisticsHistory = []
      }
      
      // 查找今天的历史记录
      let todayRecord = data.statisticsHistory.find(item => item.date === today)
      
      if (!todayRecord) {
        // 如果历史记录中没有今天的数据，添加进去
        data.statisticsHistory.push({
          date: today,
          count: stats.todayCount,
          minutes: stats.totalMinutes
        })
        
        // 保存
        window.electronAPI.writeData(data)
        console.log('已同步今日数据到历史记录:', stats.todayCount, '次,', stats.totalMinutes, '分钟')
      } else if (todayRecord.count !== stats.todayCount || todayRecord.minutes !== stats.totalMinutes) {
        // 如果数据不一致，更新历史记录
        todayRecord.count = stats.todayCount
        todayRecord.minutes = stats.totalMinutes
        window.electronAPI.writeData(data)
        console.log('已更新今日历史记录')
      }
    }
  }

  /**
   * 隐藏统计弹窗
   */
  function hideStatsModal() {
    if (elements.statsModal) {
      elements.statsModal.classList.remove('show')
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }
    }
  }

  /**
   * 更新统计概览
   */
  function updateOverview() {
    const history = getStatisticsHistory()
    const data = getDataForPeriod(history, currentPeriod)

    // 计算总次数
    const totalSessions = data.reduce((sum, item) => sum + item.count, 0)
    
    // 计算总时长（分钟）
    const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0)
    
    // 计算平均时长
    const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

    // 更新显示
    if (elements.statsTotalSessions) {
      elements.statsTotalSessions.textContent = totalSessions
    }
    if (elements.statsTotalMinutes) {
      elements.statsTotalMinutes.textContent = totalMinutes
    }
    if (elements.statsAvgMinutes) {
      elements.statsAvgMinutes.textContent = avgMinutes
    }
  }

  /**
   * 更新图表
   */
  function updateChart() {
    const history = getStatisticsHistory()
    const data = getDataForPeriod(history, currentPeriod)

    if (data.length === 0) {
      showEmptyState()
      return
    }

    hideEmptyState()

    const canvas = elements.statsChart
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    // 销毁旧图表
    if (chartInstance) {
      chartInstance.destroy()
    }

    // 准备数据
    const labels = data.map(item => item.label)
    const minutes = data.map(item => item.minutes)

    // 莫兰迪亮色配色
    const morandiColors = [
      'rgba(200, 213, 224, 0.8)',  // 莫兰迪蓝
      'rgba(232, 213, 196, 0.8)',  // 莫兰迪米
      'rgba(212, 228, 215, 0.8)',  // 莫兰迪绿
      'rgba(234, 209, 220, 0.8)',  // 莫兰迪粉
      'rgba(217, 217, 230, 0.8)',  // 莫兰迪紫
      'rgba(230, 224, 206, 0.8)',  // 莫兰迪黄
      'rgba(220, 210, 210, 0.8)'   // 莫兰迪灰粉
    ]

    const isDarkMode = document.body.classList.contains('dark-mode')
    const textColor = isDarkMode ? '#e0e0e0' : '#666'
    const gridColor = isDarkMode ? '#444' : '#e0e0e0'

    // 根据图表类型创建配置
    let chartConfig = {}

    if (currentChartType === 'pie') {
      chartConfig = {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: '专注时长（分钟）',
            data: minutes,
            backgroundColor: morandiColors,
            borderWidth: 2,
            borderColor: isDarkMode ? '#2d2d2d' : '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                padding: 10,
                font: { size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${label}: ${value}分钟 (${percentage}%)`
                }
              }
            }
          }
        }
      }
    } else if (currentChartType === 'line') {
      chartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: '专注时长（分钟）',
              data: minutes,
              borderColor: 'rgba(200, 213, 224, 1)',
              backgroundColor: 'rgba(200, 213, 224, 0.15)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgba(200, 213, 224, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              labels: {
                color: textColor,
                padding: 10,
                font: { size: 12 }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: textColor
              },
              grid: {
                color: gridColor
              }
            },
            y: {
              ticks: {
                color: textColor
              },
              grid: {
                color: gridColor
              },
              title: {
                display: true,
                text: '分钟',
                color: textColor
              }
            }
          }
        }
      }
    } else { // bar
      chartConfig = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: '专注时长（分钟）',
              data: minutes,
              backgroundColor: 'rgba(200, 213, 224, 0.8)',
              borderColor: 'rgba(200, 213, 224, 1)',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: textColor,
                padding: 10,
                font: { size: 12 }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: textColor
              },
              grid: {
                color: gridColor
              }
            },
            y: {
              ticks: {
                color: textColor
              },
              grid: {
                color: gridColor
              },
              title: {
                display: true,
                text: '分钟',
                color: textColor
              }
            }
          }
        }
      }
    }

    chartInstance = new Chart(ctx, chartConfig)
  }

  /**
   * 更新详细数据表格
   */
  function updateDetailsTable() {
    const history = getStatisticsHistory()
    const data = getDataForPeriod(history, currentPeriod)

    const tbody = elements.statsTableBody
    if (!tbody) return

    tbody.innerHTML = ''

    if (data.length === 0) {
      return
    }

    // 倒序显示（最新的在前）
    data.reverse().forEach(item => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${item.label}</td>
        <td>${item.minutes}</td>
        <td>${item.count > 0 ? Math.round(item.minutes / item.count) : 0}</td>
      `
      tbody.appendChild(row)
    })
  }

  /**
   * 显示空状态
   */
  function showEmptyState() {
    if (elements.statsChartContainer) {
      elements.statsChartContainer.innerHTML = `
        <div class="stats-empty">
          <div class="stats-empty-icon">📊</div>
          <div class="stats-empty-text">暂无数据</div>
        </div>
      `
    }
  }

  /**
   * 隐藏空状态
   */
  function hideEmptyState() {
    if (elements.statsChartContainer) {
      elements.statsChartContainer.innerHTML = '<canvas id="statsChart"></canvas>'
      elements.statsChart = document.getElementById('statsChart')
    }
  }

  /**
   * 获取统计历史数据
   */
  function getStatisticsHistory() {
    const data = DataStore.getData()
    const history = data.statisticsHistory || []
    console.log('历史数据:', history)
    return history
  }

  /**
   * 根据时间范围获取数据
   */
  function getDataForPeriod(history, period) {
    const now = new Date()
    
    if (period === 'daily') {
      // 最近7天
      return getLast7Days(history, now)
    } else if (period === 'weekly') {
      // 最近4周
      return getLast4Weeks(history, now)
    } else if (period === 'monthly') {
      // 最近6个月
      return getLast6Months(history, now)
    }
    
    return []
  }

  /**
   * 获取最近7天数据
   */
  function getLast7Days(history, now) {
    const result = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayData = history.filter(item => item.date === dateStr)
      const count = dayData.reduce((sum, item) => sum + (item.count || 0), 0)
      const minutes = dayData.reduce((sum, item) => sum + (item.minutes || 0), 0)
      
      result.push({
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        date: dateStr,
        count: count,
        minutes: minutes
      })
    }
    
    return result
  }

  /**
   * 获取最近4周数据
   */
  function getLast4Weeks(history, now) {
    const result = []
    
    for (let i = 3; i >= 0; i--) {
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() - i * 7)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)
      
      const weekData = history.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= endDate
      })
      
      const count = weekData.reduce((sum, item) => sum + (item.count || 0), 0)
      const minutes = weekData.reduce((sum, item) => sum + (item.minutes || 0), 0)
      
      result.push({
        label: `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`,
        count: count,
        minutes: minutes
      })
    }
    
    return result
  }

  /**
   * 获取最近6个月数据
   */
  function getLast6Months(history, now) {
    const result = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      const monthData = history.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month
      })
      
      const count = monthData.reduce((sum, item) => sum + (item.count || 0), 0)
      const minutes = monthData.reduce((sum, item) => sum + (item.minutes || 0), 0)
      
      result.push({
        label: `${year}/${month}`,
        count: count,
        minutes: minutes
      })
    }
    
    return result
  }

  return {
    init: init
  }
})()

// 暴露到全局
window.Statistics = Statistics
