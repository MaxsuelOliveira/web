from __future__ import annotations

import json
import os
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
HOST = os.getenv("PLAYER_HOST", "127.0.0.1")
PORT = int(os.getenv("PLAYER_PORT", "5500"))


class PlayerRequestHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            payload = json.dumps({"status": "ok", "service": "meu-player-audio"}).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()


def serve() -> None:
    handler = partial(PlayerRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((HOST, PORT), handler)

    print(f"Servidor do player disponível em http://{HOST}:{PORT}")
    print("Healthcheck: /health")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    finally:
        server.server_close()


if __name__ == "__main__":
    serve()