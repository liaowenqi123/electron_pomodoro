"""
实时检测 Windows 前台窗口名称
每隔 0.1 秒检测一次，如果窗口名称发生变化则调用 DeepSeek API 判断是否为娱乐类应用
支持配置持久化、历史记录缓存、白名单和黑名单功能
"""

import ctypes
import time
import json
import os
from openai import OpenAI

# Windows API 函数
user32 = ctypes.windll.user32

# 配置文件路径
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

def load_config():
    """加载配置文件"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"api_key": "<your api key>", "whitelist": [], "blacklist": [], "history": {}}

def save_config(config):
    """保存配置文件"""
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=4)

def get_foreground_window_title():
    """获取前台窗口的标题"""
    hwnd = user32.GetForegroundWindow()
    if hwnd == 0:
        return None
    
    length = user32.GetWindowTextLengthW(hwnd)
    if length == 0:
        return ""
    
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return buffer.value

def check_list(window_title, keyword_list):
    """检查窗口标题是否包含关键字列表中的任意关键字"""
    for keyword in keyword_list:
        if keyword in window_title:
            return True
    return False

def check_is_entertainment(window_title, config):
    """
    检查窗口是否为娱乐类应用
    优先级：白名单 -> 黑名单 -> 历史记录 -> DeepSeek API
    """
    # 1. 先查白名单（优先级最高）
    whitelist = config.get("whitelist", [])
    if check_list(window_title, whitelist):
        return "不是", config
    
    # 2. 再查黑名单
    blacklist = config.get("blacklist", [])
    if check_list(window_title, blacklist):
        return "是", config
    
    # 3. 查历史记录
    history = config.get("history", {})
    if window_title in history:
        return history[window_title], config
    
    # 4. 调用 DeepSeek API
    client = OpenAI(
        api_key=config.get("api_key", "<your api key>"),
        base_url="https://api.deepseek.com",
    )
    
    system_prompt = """你是一个窗口分类助手。根据用户提供的窗口名称，判断该应用是否属于娱乐类（如游戏、视频、音乐、直播、社交媒体等）。

请仅输出 JSON 格式：
{
    "is_entertainment": "是" 或 "不是"
}

不确定时回答"不是"。"""

    user_prompt = f"窗口名称：{window_title}"

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={'type': 'json_object'}
        )
        result = json.loads(response.choices[0].message.content)
        is_entertainment = result.get("is_entertainment", "不是")
        
        # 保存到历史记录
        config["history"][window_title] = is_entertainment
        save_config(config)
        
        return is_entertainment, config
    except Exception as e:
        return f"查询失败: {e}", config

def main():
    # 加载配置
    config = load_config()
    
    print("开始监听前台窗口变化... (按 Ctrl+C 退出)")
    print("-" * 70)
    
    last_title = None
    
    try:
        while True:
            current_title = get_foreground_window_title()
            
            # 如果窗口名称存在且与上次不同，则处理
            if current_title is not None and current_title != last_title:
                if current_title:  # 非空标题才查询
                    is_entertainment, config = check_is_entertainment(current_title, config)
                    
                    timestamp = time.strftime("%H:%M:%S", time.localtime())
                    print(f"[{timestamp}] {current_title} | 娱乐: {is_entertainment}")
                last_title = current_title
            
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\n" + "-" * 70)
        print("监听已停止。")

if __name__ == "__main__":
    main()