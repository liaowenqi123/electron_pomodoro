/**
 * AI助手配置示例
 * 
 * 使用说明：
 * 1. 复制此文件并重命名为 ai-config.js
 * 2. 在 ai-config.js 中填入您的 DeepSeek API 密钥
 * 3. 或者直接在 src/modules/aiAssistant.js 中修改 apiKey
 * 
 * 获取 DeepSeek API 密钥：
 * 访问 https://platform.deepseek.com/ 注册并获取 API Key
 */

module.exports = {
  // DeepSeek API 密钥
  apiKey: 'YOUR_DEEPSEEK_API_KEY_HERE',
  
  // API 地址（通常不需要修改）
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  
  // 使用的模型（通常不需要修改）
  model: 'deepseek-chat'
}
