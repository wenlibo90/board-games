#!/usr/bin/env python3
# 静态站点服务：端口默认 8000；根路径返回 index.html；禁止目录列表；禁用缓存。
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('PORT', '8000'))
HOST = os.environ.get('HOST', '0.0.0.0')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # 允许缓存但每次必须校验：配合 Last-Modified，未变更时返回 304，兼顾速度与更新
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def list_directory(self, path):
        # 不提供目录列表
        self.send_error(403, 'Directory listing is disabled')
        return None

    def log_message(self, fmt, *args):
        sys.stderr.write('%s - %s\n' % (self.address_string(), fmt % args))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    with Server((HOST, PORT), Handler) as httpd:
        sys.stderr.write('serving %s on http://%s:%d/\n' % (ROOT, HOST, PORT))
        httpd.serve_forever()
