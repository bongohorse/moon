#!/usr/bin/env python3
"""Route Bob's native build client through the supplied HTTPS proxy.

Bob's Extender HTTP client ignores HTTPS_PROXY. A loopback bridge preserves
TLS verification to the fixed official build service, without patching Bob.
"""
import http.server
import subprocess
import sys
import threading
import urllib.error
import urllib.request

UPSTREAM = 'https://build.defold.com'
HOP_HEADERS = {'host', 'connection', 'transfer-encoding', 'content-length',
               'proxy-authorization', 'proxy-connection', 'expect'}

class Bridge(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Never log request headers, credentials or payloads.

    def forward(self):
        data = self.rfile.read(int(self.headers.get('Content-Length', '0')))
        headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP_HEADERS}
        request = urllib.request.Request(UPSTREAM + self.path,
            data=data if self.command == 'POST' else None,
            headers=headers, method=self.command)
        try:
            response = urllib.request.urlopen(request, timeout=600)
        except urllib.error.HTTPError as error:
            response = error
        except (OSError, urllib.error.URLError):
            self.send_error(502, 'Official Defold build service unavailable')
            return
        with response:
            body = response.read()
            self.send_response(response.status)
            for key, value in response.headers.items():
                if key.lower() not in HOP_HEADERS:
                    self.send_header(key, value)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    do_GET = forward
    do_POST = forward
    do_HEAD = forward

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Bridge)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        result = subprocess.run(sys.argv[1:] + ['--build-server',
            f'http://127.0.0.1:{server.server_port}'])
    finally:
        server.shutdown()
        server.server_close()
    sys.exit(result.returncode)
