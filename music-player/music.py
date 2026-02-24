"""
测试用音乐播放器模拟程序
用于测试Electron与Python的stdin/stdout通信

通信协议:
- Electron -> Python: JSON格式字符串，以换行符结束
  - {"command": "toggle"} - 暂停/播放切换
  - {"command": "next"} - 下一首
  - {"command": "prev"} - 上一首
  - {"command": "seek", "position": 30} - 跳转到指定位置(秒)
  - {"command": "set_volume", "volume": 0.8} - 设置音量(0-1)
  
- Python -> Electron: JSON格式字符串，以换行符结束
  - {"event": "status", "data": {"playing": true, "name": "song.mp3", "current": 30, "duration": 180}}
  - {"event": "track_change", "data": {"name": "song.mp3", "duration": 180}}
  - {"event": "play_state", "data": {"playing": true}}
  - {"event": "progress", "data": {"current": 30, "duration": 180}}

快捷键模拟(实际music.exe会处理):
- space: 切换播放/暂停
- n: 下一首
- p: 上一首
"""

import sys
import json
import threading
import time
import random

# 设置UTF-8编码
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

class MockMusicPlayer:
    def __init__(self):
        self.playing = False
        self.current_time = 0
        self.duration = 180  # 模拟歌曲总时长(秒)
        self.track_name = "test_song.mp3"
        self.volume = 0.8
        self.tracks = ["test_song.mp3", "another_song.mp3", "beautiful_music.mp3"]
        self.track_index = 0
        self.running = True
        
    def send_event(self, event_type, data):
        """向stdout发送事件"""
        output = json.dumps({"event": event_type, "data": data}, ensure_ascii=False)
        sys.stdout.write(output + "\n")
        sys.stdout.flush()
        
    def send_status(self):
        """发送当前状态"""
        self.send_event("status", {
            "playing": self.playing,
            "name": self.track_name,
            "current": self.current_time,
            "duration": self.duration
        })
        
    def next_track(self):
        """切换到下一首"""
        self.track_index = (self.track_index + 1) % len(self.tracks)
        self.track_name = self.tracks[self.track_index]
        self.current_time = 0
        self.duration = random.randint(120, 300)  # 随机时长
        self.send_event("track_change", {
            "name": self.track_name,
            "duration": self.duration
        })
        
    def prev_track(self):
        """切换到上一首"""
        self.track_index = (self.track_index - 1) % len(self.tracks)
        self.track_name = self.tracks[self.track_index]
        self.current_time = 0
        self.duration = random.randint(120, 300)
        self.send_event("track_change", {
            "name": self.track_name,
            "duration": self.duration
        })
        
    def toggle_play(self):
        """切换播放/暂停"""
        self.playing = not self.playing
        self.send_event("play_state", {"playing": self.playing})
        self.send_status()
        
    def seek(self, position):
        """跳转到指定位置"""
        self.current_time = max(0, min(position, self.duration))
        self.send_status()
        
    def set_volume(self, volume):
        """设置音量"""
        self.volume = max(0, min(volume, 1))
        # 音量变化不需要发送事件
        
    def process_command(self, command_obj):
        """处理来自Electron的命令"""
        command = command_obj.get("command")
        
        if command == "toggle":
            self.toggle_play()
        elif command == "next":
            self.next_track()
        elif command == "prev":
            self.prev_track()
        elif command == "seek":
            position = command_obj.get("position", 0)
            self.seek(position)
        elif command == "set_volume":
            volume = command_obj.get("volume", 0.8)
            self.set_volume(volume)
        elif command == "get_status":
            self.send_status()
            
    def progress_thread(self):
        """模拟播放进度的线程"""
        while self.running:
            if self.playing:
                self.current_time += 1
                if self.current_time >= self.duration:
                    # 歌曲结束，自动下一首
                    self.next_track()
                else:
                    # 每秒报告一次进度
                    self.send_event("progress", {
                        "current": self.current_time,
                        "duration": self.duration
                    })
            time.sleep(1)
            
    def read_commands(self):
        """读取来自Electron的命令"""
        # 启动进度线程
        progress_t = threading.Thread(target=self.progress_thread, daemon=True)
        progress_t.start()
        
        # 发送初始状态
        self.send_status()
        
        # 主线程读取stdin
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                command = json.loads(line)
                self.process_command(command)
            except json.JSONDecodeError as e:
                sys.stderr.write(f"JSON解析错误: {e}\n")
                sys.stderr.flush()


if __name__ == "__main__":
    player = MockMusicPlayer()
    player.read_commands()
