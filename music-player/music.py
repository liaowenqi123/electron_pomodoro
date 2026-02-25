"""
音乐播放器 - 带通讯功能
支持stdin/stdout与Electron通信，同时保留快捷键控制

通信协议:
- Electron -> Python: JSON格式字符串，以换行符结束
  - {"command": "toggle"} - 暂停/播放切换
  - {"command": "next"} - 下一首
  - {"command": "prev"} - 上一首
  - {"command": "seek", "position": 30} - 跳转到指定位置(秒)
  - {"command": "set_volume", "volume": 0.8} - 设置音量(0-1)
  - {"command": "get_status"} - 获取当前状态
  - {"command": "get_devices"} - 获取输出设备列表
  - {"command": "set_device", "device_id": 5} - 设置输出设备
  
- Python -> Electron: JSON格式字符串，以换行符结束
  - {"event": "status", "data": {"playing": true, "name": "song.mp3", "current": 30, "duration": 180}}
  - {"event": "track_change", "data": {"name": "song.mp3", "duration": 180}}
  - {"event": "play_state", "data": {"playing": true}}
  - {"event": "progress", "data": {"current": 30, "duration": 180}}
  - {"event": "devices", "data": {"devices": [...], "current": 5}}

快捷键:
- 右Ctrl + 右Shift: 暂停/继续
- 右Ctrl + Q: 退出程序
- 右Ctrl + 左/右方向键: 上一首/下一首
- 右Ctrl + 上/下方向键: 音量增/减
"""

import os
import sounddevice as sd
import soundfile as sf
import random
import threading
import time
import json
from pynput import keyboard
import sys

# 设置UTF-8编码（用于与Electron通信）
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# ============ 全局状态 ============
class PlayerState:
    def __init__(self):
        self.playing = False
        self.should_play = False  # 用户请求播放（用于启动播放）
        self.pause_program = False
        self.next_one = False
        self.prev_one = False
        self.exit_program = False
        self.volume = 1.0
        self.current_time = 0
        self.duration = 0
        self.track_name = ""
        self.seek_position = None  # 用于seek功能
        self.play_history = []  # 已播放的歌曲索引历史
        self.shuffled_playlist = []  # 随机排序后的播放列表
        self.playlist_index = -1  # 当前播放歌曲在shuffled_playlist中的索引
        self.file_list = []
        self.directory_path = "music/"
        self.current_device_id = None  # 当前设备ID
        self.device_changed = False  # 设备切换标志，用于不切歌继续播放
        self.lock = threading.Lock()
        
        # 预加载的音频数据
        self.preloaded_data = None
        self.preloaded_fs = None
        self.preloaded_song = None
        
    def send_event(self, event_type, data):
        """向stdout发送事件（给Electron）"""
        output = json.dumps({"event": event_type, "data": data}, ensure_ascii=False)
        sys.stdout.write(output + "\n")
        sys.stdout.flush()
        
    def send_status(self):
        """发送当前状态"""
        with self.lock:
            self.send_event("status", {
                "playing": self.playing,
                "name": self.track_name,
                "current": self.current_time,
                "duration": self.duration
            })
            
    def send_devices(self):
        """发送设备列表"""
        devices = get_output_devices()
        self.send_event("devices", {
            "devices": devices,
            "current": self.current_device_id
        })

state = PlayerState()

# ============ 输出设备管理 ============
def get_output_devices():
    """获取所有 WASAPI 输出设备列表"""
    devices = sd.query_devices()
    hostapis = sd.query_hostapis()
    output_devices = []
    
    for i, device in enumerate(devices):
        if device['max_output_channels'] > 0:
            hostapi_name = hostapis[device['hostapi']]['name']
            # 只返回 WASAPI 设备
            if 'WASAPI' in hostapi_name:
                output_devices.append({
                    "id": i,
                    "name": device['name'][:50],
                    "hostapi": hostapi_name,
                    "is_default": device.get('is_default', False)
                })
    return output_devices

def set_output_device(device_id):
    """设置输出设备，切换后从当前位置继续播放"""
    try:
        devices = sd.query_devices()
        if 0 <= device_id < len(devices):
            if devices[device_id]['max_output_channels'] > 0:
                sd.default.device = device_id
                state.current_device_id = device_id
                print(f"已切换到设备: {devices[device_id]['name']}", file=sys.stderr)
                # 设置设备切换标志，让播放函数重新打开流继续播放
                with state.lock:
                    state.device_changed = True
                return True
        return False
    except Exception as e:
        print(f"设置设备失败: {e}", file=sys.stderr)
        return False

def select_output_device(initial_device_id=None):
    """选择输出设备，支持初始化设备ID"""
    devices = sd.query_devices()
    
    # 如果有指定的初始设备ID，尝试使用它
    if initial_device_id is not None:
        try:
            if 0 <= initial_device_id < len(devices):
                if devices[initial_device_id]['max_output_channels'] > 0:
                    sd.default.device = initial_device_id
                    state.current_device_id = initial_device_id
                    print(f"使用指定设备: {devices[initial_device_id]['name']}", file=sys.stderr)
                    return initial_device_id
        except Exception as e:
            print(f"指定设备失败: {e}", file=sys.stderr)
    
    # 自动选择默认输出设备
    default_device = sd.query_devices(kind='output')
    state.current_device_id = default_device['index'] if 'index' in default_device else None
    print(f"使用默认输出设备: {default_device['name']}", file=sys.stderr)
    return None

select_output_device()

# ============ 快捷键定义 ============
pause_key = {keyboard.Key.ctrl_r, keyboard.Key.shift_r}
exit_key = {keyboard.Key.ctrl_r, keyboard.KeyCode.from_char('q')}
next_key = {keyboard.Key.ctrl_r, keyboard.Key.right}
prev_key = {keyboard.Key.ctrl_r, keyboard.Key.left}
voice_up = {keyboard.Key.ctrl_r, keyboard.Key.up}
voice_down = {keyboard.Key.ctrl_r, keyboard.Key.down}

current_keys = set()
listener = None

def key_to_str(key):
    if isinstance(key, keyboard.Key):
        return str(key)
    elif isinstance(key, keyboard.KeyCode):
        return key.char if key.char else str(key)

def keys_pressed(required_keys):
    for k in required_keys:
        found = False
        for ck in current_keys:
            if key_to_str(k) == key_to_str(ck):
                found = True
                break
        if not found:
            return False
    return True

def on_key_press(key):
    current_keys.add(key)
    
    # 禁用 Ctrl+Q 快捷键退出功能（由 Electron 控制生命周期）
    # if keys_pressed(exit_key):
    #     print("退出程序（快捷键）", file=sys.stderr)
    #     with state.lock:
    #         state.exit_program = True
    #     return False
    
    if keys_pressed(pause_key):
        with state.lock:
            state.pause_program = not state.pause_program
            print("暂停" if state.pause_program else "继续", file=sys.stderr)
    
    if keys_pressed(next_key):
        print("下一曲（快捷键）", file=sys.stderr)
        with state.lock:
            state.next_one = True
    
    if keys_pressed(prev_key):
        print("上一曲（快捷键）", file=sys.stderr)
        with state.lock:
            state.prev_one = True
    
    if keys_pressed(voice_up):
        with state.lock:
            if state.volume + 0.1 >= 1.0:
                state.volume = 1.0
            else:
                state.volume += 0.1
            print(f"音量: {state.volume:.1f}", file=sys.stderr)
            state.send_event("volume_change", {"volume": state.volume})
    
    if keys_pressed(voice_down):
        with state.lock:
            if state.volume - 0.1 <= 0:
                state.volume = 0
            else:
                state.volume -= 0.1
            print(f"音量: {state.volume:.1f}", file=sys.stderr)
            state.send_event("volume_change", {"volume": state.volume})

def on_key_release(key):
    try:
        current_keys.discard(key)
    except KeyError:
        pass

def start_keyboard_listener():
    global listener
    listener = keyboard.Listener(on_press=on_key_press, on_release=on_key_release)
    listener.start()

start_keyboard_listener()

# ============ 文件列表管理 ============
def list_files_in_directory(directory_path):
    file_names = []
    if os.path.exists(directory_path) and os.path.isdir(directory_path):
        for filename in os.listdir(directory_path):
            if os.path.isfile(os.path.join(directory_path, filename)):
                # 只添加音频文件
                if filename.lower().endswith(('.wav', '.mp3', '.flac', '.ogg', '.m4a')):
                    file_names.append(filename)
    return file_names

def init_shuffled_playlist():
    """初始化随机播放列表"""
    state.file_list = list_files_in_directory(state.directory_path)
    if not state.file_list:
        state.shuffled_playlist = []
        return False
    # 创建随机播放顺序
    state.shuffled_playlist = state.file_list.copy()
    random.shuffle(state.shuffled_playlist)
    state.playlist_index = -1
    state.play_history = []
    return True

def get_next_song():
    """获取下一首歌"""
    if not state.shuffled_playlist:
        if not init_shuffled_playlist():
            return None
    state.playlist_index += 1
    # 如果播放完所有歌曲，重新随机
    if state.playlist_index >= len(state.shuffled_playlist):
        random.shuffle(state.shuffled_playlist)
        state.playlist_index = 0
    state.play_history.append(state.playlist_index)
    return state.shuffled_playlist[state.playlist_index]

def get_prev_song():
    """获取上一首歌"""
    if not state.shuffled_playlist:
        if not init_shuffled_playlist():
            return None
    # 如果有历史记录，回退到上一首
    if len(state.play_history) > 1:
        state.play_history.pop()  # 移除当前歌曲
        state.playlist_index = state.play_history[-1]  # 获取上一首的索引
    return state.shuffled_playlist[state.playlist_index]

# ============ 播放函数 ============
def play_a_song(name, start_position=0):
    if name is None:
        return "error"
    
    try:
        # 检查是否有预加载的数据可以使用
        if state.preloaded_song == name and state.preloaded_data is not None:
            data = state.preloaded_data
            fs = state.preloaded_fs
            # 清除预加载的数据（只用一次）
            state.preloaded_data = None
            state.preloaded_song = None
            state.preloaded_fs = None
        else:
            # 读取音频文件
            file_path = state.directory_path + name
            with sf.SoundFile(file_path) as f:
                fs = f.samplerate
                data = f.read(always_2d=True).astype('float32')
        
        # 确保数据是二维的
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        channels = data.shape[1]
        total_frames = len(data)
        duration = total_frames / fs
        
        with state.lock:
            state.track_name = name
            state.duration = int(duration)
            state.playing = True
            if start_position == 0:
                state.current_time = 0
                state.send_event("track_change", {
                    "name": name,
                    "duration": state.duration
                })
        
        current_frame = int(start_position * fs) if start_position > 0 else 0
        chunk_size = 4096
        last_progress_time = int(current_frame / fs)
        
        stream = sd.OutputStream(
            samplerate=fs,
            channels=channels,
            dtype='float32'
        )
        stream.start()
        
        while current_frame < total_frames:
            # 检查退出
            with state.lock:
                if state.exit_program:
                    stream.stop()
                    stream.close()
                    return "exit"
                
                if state.device_changed:
                    # 设备切换：保存当前位置，返回 device_change 状态
                    state.device_changed = False
                    saved_position = current_frame / fs
                    stream.stop()
                    stream.close()
                    return ("device_change", saved_position)
                
                if state.next_one:
                    state.next_one = False
                    stream.stop()
                    stream.close()
                    return "next"
                
                if state.prev_one:
                    state.prev_one = False
                    stream.stop()
                    stream.close()
                    return "prev"
                
                # 检查seek
                if state.seek_position is not None:
                    seek_frame = int(state.seek_position * fs)
                    current_frame = max(0, min(seek_frame, total_frames - chunk_size))
                    state.seek_position = None
                    state.current_time = int(current_frame / fs)
            
            # 检查暂停
            pause_local = False
            with state.lock:
                pause_local = state.pause_program
                if pause_local:
                    state.playing = False
                    state.send_event("play_state", {"playing": False})
            
            if pause_local:
                stream.stop()
                print("已暂停", file=sys.stderr, flush=True)
                
                while True:
                    with state.lock:
                        if state.exit_program:
                            stream.close()
                            return "exit"
                        if state.device_changed:
                            # 设备切换：保存当前位置
                            state.device_changed = False
                            saved_position = current_frame / fs
                            stream.close()
                            return ("device_change", saved_position)
                        if state.next_one:
                            state.next_one = False
                            stream.close()
                            return "next"
                        if state.prev_one:
                            state.prev_one = False
                            stream.close()
                            return "prev"
                        if not state.pause_program:
                            state.playing = True
                            state.send_event("play_state", {"playing": True})
                            break
                    time.sleep(0.05)
                
                stream.start()
                print("继续播放", file=sys.stderr)
            
            # 写入数据
            end_frame = min(current_frame + chunk_size, total_frames)
            chunk = (data[current_frame:end_frame] * state.volume).astype('float32')
            stream.write(chunk)
            current_frame = end_frame
            
            # 更新进度（每秒发送一次）
            current_time = int(current_frame / fs)
            if current_time != last_progress_time:
                last_progress_time = current_time
                with state.lock:
                    state.current_time = current_time
                    state.send_event("progress", {
                        "current": current_time,
                        "duration": int(duration)
                    })
        
        stream.close()
        with state.lock:
            state.playing = False
        return "done"
            
    except Exception as e:
        print(f"播放错误: {e}", file=sys.stderr)
        return "error"

# ============ 命令处理 ============
def process_command(command_obj):
    """处理来自Electron的命令"""
    command = command_obj.get("command")
    
    if command == "toggle":
        with state.lock:
            if not state.should_play:
                # 还没开始播放，请求开始
                state.should_play = True
                state.pause_program = False
                state.playing = True
                state.send_event("play_state", {"playing": True})
                print("toggle: 请求开始播放", file=sys.stderr)
            elif state.pause_program:
                # 当前是暂停状态，恢复播放
                state.pause_program = False
                print("toggle: 继续播放", file=sys.stderr)
            else:
                # 当前正在播放，暂停
                state.pause_program = True
                print("toggle: 暂停", file=sys.stderr)
    
    elif command == "next":
        print("next命令", file=sys.stderr)
        with state.lock:
            state.next_one = True
    
    elif command == "prev":
        print("prev命令", file=sys.stderr)
        with state.lock:
            state.prev_one = True
    
    elif command == "seek":
        position = command_obj.get("position", 0)
        print(f"seek命令: {position}秒", file=sys.stderr)
        with state.lock:
            state.seek_position = position
    
    elif command == "set_volume":
        volume = command_obj.get("volume", 0.8)
        print(f"set_volume命令: {volume}", file=sys.stderr)
        with state.lock:
            state.volume = max(0, min(volume, 1))
            state.send_event("volume_change", {"volume": state.volume})
    
    elif command == "get_status":
        state.send_status()
    
    elif command == "get_devices":
        state.send_devices()
    
    elif command == "set_device":
        device_id = command_obj.get("device_id")
        if device_id is not None:
            success = set_output_device(device_id)
            if success:
                state.send_devices()

def stdin_reader():
    """读取来自Electron的命令（后台线程）"""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            command = json.loads(line)
            process_command(command)
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}", file=sys.stderr)

def get_song_duration(name):
    """获取歌曲时长（不加载全部数据）"""
    try:
        info = sf.info(state.directory_path + name)
        return int(info.duration)
    except Exception as e:
        print(f"获取歌曲信息失败: {e}", file=sys.stderr)
        return 0

def preload_first_song():
    """预加载第一首歌的信息（不播放）- 仅获取基本信息"""
    song = get_next_song()
    if song:
        state.track_name = song
        state.duration = get_song_duration(song)
        state.current_time = 0
        state.playing = False
        state.should_play = False
        return song
    return None

def preload_audio_data(song):
    """在后台预加载音频数据到内存"""
    if song:
        try:
            file_path = state.directory_path + song
            with sf.SoundFile(file_path) as f:
                data = f.read(always_2d=True)
                state.preloaded_data = data.astype('float32')
                state.preloaded_fs = f.samplerate
                state.preloaded_song = song
        except Exception as e:
            print(f"预加载音频数据失败: {e}", file=sys.stderr)

# ============ 主程序 ============
if __name__ == "__main__":
    # 读取命令行参数（设备ID）
    initial_device_id = None
    if len(sys.argv) > 1:
        try:
            initial_device_id = int(sys.argv[1])
        except ValueError:
            pass
    
    # 选择输出设备
    select_output_device(initial_device_id)
    
    # 启动stdin读取线程
    stdin_thread = threading.Thread(target=stdin_reader, daemon=True)
    stdin_thread.start()
    
    # 初始化播放列表
    init_shuffled_playlist()
    
    # 预加载第一首歌的基本信息（不加载音频数据，不阻塞）
    current_song = preload_first_song()
    current_position = 0
    
    # 先发送初始状态给JS（让UI能正确显示）
    state.send_status()
    
    # 发送准备就绪事件
    state.send_event("ready", {
        "name": state.track_name, 
        "duration": state.duration
    })
    
    # 在后台线程预加载音频数据（不阻塞主线程）
    if current_song:
        preload_thread = threading.Thread(target=preload_audio_data, args=(current_song,), daemon=True)
        preload_thread.start()
    
    # 主循环
    while True:
        with state.lock:
            if state.exit_program:
                break
        
        # 检查是否需要播放
        playing_local = False
        with state.lock:
            playing_local = state.playing and not state.pause_program
        
        if not playing_local:
            # 等待播放命令
            time.sleep(0.05)
            continue
        
        if current_song is None:
            print("没有找到音乐文件", file=sys.stderr)
            time.sleep(1)
            continue
        
        # 开始播放当前歌曲
        result = play_a_song(current_song, current_position)
        
        if result == "exit":
            break
        elif result == "next":
            current_song = get_next_song()
            current_position = 0
        elif result == "prev":
            current_song = get_prev_song()
            current_position = 0
        elif isinstance(result, tuple) and result[0] == "device_change":
            # 设备切换：保持当前歌曲，从保存的位置继续
            current_position = result[1]
        elif result == "done":
            # 歌曲播放完毕，播放下一首
            current_song = get_next_song()
            current_position = 0
            # 保持播放状态，继续播放下一首
            with state.lock:
                state.playing = True
        elif result == "error":
            # 出错时跳到下一首
            current_song = get_next_song()
            current_position = 0
            with state.lock:
                state.playing = True
    
    if listener:
        listener.stop()
    print("程序已退出", file=sys.stderr)
