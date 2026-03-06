"""
实时检测 Windows 前台窗口名称
每隔 0.1 秒检测一次，如果窗口名称发生变化则调用 AI API 判断是否为娱乐类应用
支持配置持久化、历史记录缓存、白名单和黑名单功能
"""

import ctypes
import time
import json
import os
import sys
from openai import OpenAI

# Windows API 函数
user32 = ctypes.windll.user32


def get_base_path():
    """获取基础路径，兼容 PyInstaller 打包"""
    if getattr(sys, 'frozen', False):
        # 打包后：使用 exe 所在目录
        return os.path.dirname(sys.executable)
    else:
        # 开发环境：使用脚本所在目录
        return os.path.dirname(os.path.abspath(__file__))


BASE_PATH = get_base_path()
API_CONFIG_FILE = os.path.join(BASE_PATH, "api_config.json")
LIST_CONFIG_FILE = os.path.join(BASE_PATH, "list_config.json")


# ============ 默认配置 ============

DEFAULT_API_CONFIG = {
    "base_url": "https://api.deepseek.com",
    "api_key": "<your api key>",
    "model": "deepseek-chat"
}

DEFAULT_LIST_CONFIG = {
    "whitelist": [
        "文件资源管理器",
        "Visual Studio Code",
        "PowerShell",
        "PowerPoint",
        "演示文稿"
    ],
    "blacklist": [
        "bilibili",
        "抖音",
        "快手",
        "斗鱼",
        "虎牙"
    ],
    "history": {}
}


# ============ 配置加载/保存 ============

def load_json_file(file_path, default_config):
    """加载 JSON 配置文件，不存在则创建默认配置"""
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    # 文件不存在或读取失败，创建默认配置
    save_json_file(file_path, default_config)
    return default_config.copy()


def save_json_file(file_path, config):
    """保存 JSON 配置文件"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=4)


def load_api_config():
    """加载 API 配置"""
    return load_json_file(API_CONFIG_FILE, DEFAULT_API_CONFIG)


def load_list_config():
    """加载列表配置（黑白名单、历史记录）"""
    return load_json_file(LIST_CONFIG_FILE, DEFAULT_LIST_CONFIG)


def save_list_config(config):
    """保存列表配置"""
    save_json_file(LIST_CONFIG_FILE, config)


# ============ 窗口检测 ============

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


def check_is_entertainment(window_title, api_config, list_config):
    """
    检查窗口是否为娱乐类应用
    优先级：白名单 -> 黑名单 -> 历史记录 -> AI API
    """
    # 1. 先查白名单（优先级最高）
    whitelist = list_config.get("whitelist", [])
    if check_list(window_title, whitelist):
        return "不是", list_config
    
    # 2. 再查黑名单
    blacklist = list_config.get("blacklist", [])
    if check_list(window_title, blacklist):
        return "是", list_config
    
    # 3. 查历史记录
    history = list_config.get("history", {})
    if window_title in history:
        return history[window_title], list_config
    
    # 4. 调用 AI API
    client = OpenAI(
        api_key=api_config.get("api_key", "<your api key>"),
        base_url=api_config.get("base_url", "https://api.deepseek.com"),
    )
    
    model = api_config.get("model", "deepseek-chat")
    
    system_prompt = """你是一个窗口分类助手。根据用户提供的窗口名称，判断该应用是否属于娱乐类（如游戏、视频、音乐、直播、社交媒体等）。

请仅输出 JSON 格式：
{
    "is_entertainment": "是" 或 "不是"
}

不确定时回答"不是"。"""

    user_prompt = f"窗口名称：{window_title}"

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={'type': 'json_object'}
        )
        result = json.loads(response.choices[0].message.content)
        is_entertainment = result.get("is_entertainment", "不是")
        
        # 保存到历史记录
        list_config["history"][window_title] = is_entertainment
        save_list_config(list_config)
        
        return is_entertainment, list_config
    except Exception as e:
        return f"查询失败: {e}", list_config


# ============ 主程序 ============

def main():
    # 加载配置
    api_config = load_api_config()
    list_config = load_list_config()
    
    print("开始监听前台窗口变化... (按 Ctrl+C 退出)")
    print(f"API 配置: {api_config.get('base_url')} | 模型: {api_config.get('model')}")
    print("-" * 70)
    
    last_title = None
    
    try:
        while True:
            current_title = get_foreground_window_title()
            
            # 如果窗口名称存在且与上次不同，则处理
            if current_title is not None and current_title != last_title:
                if current_title:  # 非空标题才查询
                    is_entertainment, list_config = check_is_entertainment(
                        current_title, api_config, list_config
                    )
                    
                    timestamp = time.strftime("%H:%M:%S", time.localtime())
                    print(f"[{timestamp}] {current_title} | 娱乐: {is_entertainment}")
                last_title = current_title
            
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\n" + "-" * 70)
        print("监听已停止。")


if __name__ == "__main__":
    main()
