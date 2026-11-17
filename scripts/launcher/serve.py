#!/usr/bin/env python3
"""Serve this self-contained lesson on this computer only."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse
import webbrowser

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8767)
parser.add_argument('--no-open', action='store_true')
args = parser.parse_args()
if not (root / 'index.html').is_file():
    raise SystemExit('请把启动文件放在完整课件文件夹中，与 index.html 放在一起。')
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript', '.webp': 'image/webp', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.vtt': 'text/vtt', '.glb': 'model/gltf-binary'}
    def log_message(self, *args):
        pass
handler = partial(Handler, directory=str(root))
try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
except OSError:
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
url = f'http://127.0.0.1:{server.server_port}/'
print(f'朱迪的四季课堂已打开：{url}\n上课时请保留此窗口。结束后按 Control + C 关闭。', flush=True)
if not args.no_open:
    webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\n课堂已关闭。')
finally:
    server.server_close()
