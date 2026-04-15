from __future__ import annotations

import base64
import getpass
import json
import os
import platform
import secrets
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import psutil


HOST = "127.0.0.1"
PORT = 8765
BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
CONFIG_PATH = BASE_DIR / "config.json"
CONFIG_EXAMPLE_PATH = BASE_DIR / "config.example.json"
RUNTIME_DIR = BASE_DIR / "runtime"
TOKENS_PATH = RUNTIME_DIR / "google_tokens.json"
START_SCRIPT_PATH = PROJECT_DIR / "start-monitor-hub.bat"
TASK_SCRIPT_PATH = PROJECT_DIR / "register-monitor-hub-task.ps1"


@dataclass
class HealthItem:
    title: str
    description: str
    status: str


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")


def decode_jwt_payload(token: str | None) -> dict[str, Any]:
    if not token or token.count(".") < 2:
        return {}

    segment = token.split(".")[1]
    padding = "=" * (-len(segment) % 4)

    try:
        raw = base64.urlsafe_b64decode(segment + padding)
        return json.loads(raw.decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return {}


class GoogleIntegration:
    def __init__(self) -> None:
        self.pending_states: set[str] = set()

    def _config(self) -> dict[str, Any]:
        file_config = read_json(CONFIG_PATH)
        google_file = file_config.get("google", {})
        redirect_uri = google_file.get("redirect_uri") or os.environ.get(
            "GOOGLE_REDIRECT_URI",
            f"http://{HOST}:{PORT}/auth/google/callback",
        )

        scopes = google_file.get("scopes") or ["openid", "email", "profile"]
        return {
          "client_id": google_file.get("client_id") or os.environ.get("GOOGLE_CLIENT_ID", ""),
          "client_secret": google_file.get("client_secret") or os.environ.get("GOOGLE_CLIENT_SECRET", ""),
          "redirect_uri": redirect_uri,
          "scopes": scopes,
        }

    def _tokens(self) -> dict[str, Any]:
        return read_json(TOKENS_PATH)

    def is_configured(self) -> bool:
        config = self._config()
        return bool(config["client_id"] and config["client_secret"] and config["redirect_uri"])

    def status_payload(self, base_url: str) -> dict[str, Any]:
        tokens = self._tokens()
        profile = decode_jwt_payload(tokens.get("id_token"))
        connected = bool(tokens.get("access_token"))
        configured = self.is_configured()

        if connected:
            message = "Conta pronta para sincronizar perfis, tarefas e rotinas locais."
            badge = "ativo"
        elif configured:
            message = "Credenciais presentes. O login local pode ser iniciado no navegador."
            badge = "login"
        else:
            message = "Preencha server/config.json com client id e secret para liberar o fluxo Google OAuth."
            badge = "setup"

        return {
            "configured": configured,
            "connected": connected,
            "auth_url": f"{base_url}/auth/google/start" if configured else None,
            "profile_email": profile.get("email"),
            "badge": badge,
            "message": message,
        }

    def start_authorization(self) -> str | None:
        if not self.is_configured():
            return None

        config = self._config()
        state = secrets.token_urlsafe(24)
        self.pending_states.add(state)
        params = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "scope": " ".join(config["scopes"]),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)

    def handle_callback(self, query: dict[str, list[str]]) -> tuple[bool, str]:
        state = query.get("state", [""])[0]
        code = query.get("code", [""])[0]
        error = query.get("error", [""])[0]

        if error:
            return False, f"Google retornou o erro: {error}."

        if state not in self.pending_states:
            return False, "State invalido. Inicie o login novamente pelo dashboard."

        self.pending_states.discard(state)

        if not code:
            return False, "Nenhum code foi recebido do Google."

        config = self._config()
        payload = urllib.parse.urlencode(
            {
                "code": code,
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": config["redirect_uri"],
                "grant_type": "authorization_code",
            }
        ).encode("utf-8")

        request = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error_response:
            body = error_response.read().decode("utf-8", errors="ignore")
            return False, f"Falha ao trocar o code por token: {body or error_response.reason}."
        except OSError as error_response:
            return False, f"Falha de rede ao falar com o Google: {error_response}."

        write_json(TOKENS_PATH, data)
        profile = decode_jwt_payload(data.get("id_token"))
        email = profile.get("email")
        return True, f"Login Google concluido com sucesso{f' para {email}' if email else ''}."


class MetricsCollector:
    def __init__(self) -> None:
        self.previous_net = psutil.net_io_counters()
        self.previous_net_time = time.time()
        self.logical_cpu_count = psutil.cpu_count(logical=True) or 1
        psutil.cpu_percent(interval=None)
        psutil.cpu_percent(interval=None, percpu=True)

    def collect(self) -> dict[str, Any]:
        cpu_percent = psutil.cpu_percent(interval=None)
        cpu_per_core = psutil.cpu_percent(interval=None, percpu=True)
        memory = psutil.virtual_memory()
        disk_path = os.environ.get("SystemDrive", "C:") + "\\"
        disk = psutil.disk_usage(disk_path)
        net_payload = self._network_payload()
        battery = self._battery_payload()
        processes = self._top_processes()
        health = self._health_payload(cpu_percent, memory.percent, disk.percent, net_payload["online"], battery)

        return {
            "meta": {
                "refreshed_at": datetime.now().strftime("%H:%M:%S"),
            },
            "system": {
                "hostname": socket.gethostname(),
                "platform": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "uptime_seconds": max(0, int(time.time() - psutil.boot_time())),
                "local_ip": self._local_ip(),
                "user_name": getpass.getuser(),
                "battery": battery,
            },
            "resources": {
                "cpu": {
                    "percent": cpu_percent,
                    "per_core": cpu_per_core,
                    "core_count": self.logical_cpu_count,
                    "temperature_celsius": self._temperature(),
                },
                "memory": {
                    "percent": memory.percent,
                    "used": memory.used,
                    "total": memory.total,
                },
                "disk": {
                    "percent": disk.percent,
                    "used": disk.used,
                    "total": disk.total,
                },
            },
            "network": net_payload,
            "processes": {
                "total": len(psutil.pids()),
                "top": processes,
            },
            "health": health,
        }

    def _network_payload(self) -> dict[str, Any]:
        current = psutil.net_io_counters()
        current_time = time.time()
        elapsed = max(current_time - self.previous_net_time, 1e-6)

        upload_speed = max(0.0, (current.bytes_sent - self.previous_net.bytes_sent) / elapsed)
        download_speed = max(0.0, (current.bytes_recv - self.previous_net.bytes_recv) / elapsed)

        self.previous_net = current
        self.previous_net_time = current_time

        stats = psutil.net_if_stats()
        online = any(interface.isup for interface in stats.values())

        return {
            "online": online,
            "bytes_sent": current.bytes_sent,
            "bytes_recv": current.bytes_recv,
            "upload_speed": upload_speed,
            "download_speed": download_speed,
        }

    def _battery_payload(self) -> dict[str, Any] | None:
        try:
            battery = psutil.sensors_battery()
        except Exception:
            battery = None

        if battery is None:
            return None

        return {
            "percent": battery.percent,
            "secsleft": battery.secsleft,
            "power_plugged": battery.power_plugged,
        }

    def _temperature(self) -> float | None:
        try:
            sensors = psutil.sensors_temperatures()
        except Exception:
            sensors = {}

        for entries in sensors.values():
            for entry in entries:
                current = getattr(entry, "current", None)
                if current is not None:
                    return float(current)

        return None

    def _local_ip(self) -> str | None:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.connect(("8.8.8.8", 80))
                return sock.getsockname()[0]
        except OSError:
            return None

    def _top_processes(self) -> list[dict[str, Any]]:
        processes: list[dict[str, Any]] = []

        for process in psutil.process_iter(["pid", "name", "memory_info"]):
            try:
                info = process.info
                pid = info["pid"]
                name = info.get("name") or "Processo sem nome"

                if pid == 0 or name.lower() == "system idle process":
                    continue

                processes.append(
                    {
                        "pid": pid,
                        "name": name,
                        "memory_rss": getattr(info.get("memory_info"), "rss", 0),
                        "cpu_percent": min(100.0, process.cpu_percent(interval=None) / self.logical_cpu_count),
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        processes.sort(key=lambda item: (item["cpu_percent"], item["memory_rss"]), reverse=True)
        return processes[:5]

    def _health_payload(
        self,
        cpu_percent: float,
        memory_percent: float,
        disk_percent: float,
        network_online: bool,
        battery: dict[str, Any] | None,
    ) -> dict[str, Any]:
        items = [
            self._health_item(
                "CPU sob controle",
                cpu_percent < 85,
                f"Uso atual em {round(cpu_percent)}%.",
                "Carga acima do ideal. Revise os processos mais ativos.",
            ),
            self._health_item(
                "Memoria confortavel",
                memory_percent < 85,
                f"Consumo em {round(memory_percent)}%.",
                "Memoria pressionada. Feche apps pesados ou aumente disponibilidade.",
            ),
            self._health_item(
                "Armazenamento seguro",
                disk_percent < 85,
                f"Disco ocupado em {round(disk_percent)}%.",
                "Pouco espaco livre. Limpeza recomendada antes de gargalo.",
            ),
            self._health_item(
                "Rede ativa",
                network_online,
                "Interfaces de rede estao responsivas.",
                "Nenhuma interface ativa detectada no momento.",
            ),
        ]

        if battery and battery.get("percent") is not None:
            items.append(
                self._health_item(
                    "Energia do dispositivo",
                    battery["power_plugged"] or battery["percent"] > 25,
                    f"Bateria em {round(battery['percent'])}%.",
                    "Bateria baixa sem carregador conectado.",
                )
            )

        ok_count = sum(1 for item in items if item.status == "ok")
        score = round((ok_count / len(items)) * 100)

        if score >= 90:
            summary = "Desktop estavel, com margem boa para trabalho, monitoramento e multitarefa."
        elif score >= 70:
            summary = "Sistema operando bem, mas ja existem pontos de atencao para observar nas proximas leituras."
        else:
            summary = "Estado exige cuidado. O painel detectou gargalos que merecem acao imediata."

        return {
            "score": score,
            "summary": summary,
            "items": [asdict(item) for item in items],
        }

    def _health_item(self, title: str, condition: bool, success: str, warning: str) -> HealthItem:
        if condition:
            return HealthItem(title=title, description=success, status="ok")

        return HealthItem(title=title, description=warning, status="warning")


class AutomationEngine:
    def build(self, payload: dict[str, Any], google_status: dict[str, Any]) -> dict[str, Any]:
        disk_percent = payload["resources"]["disk"]["percent"]
        cpu_percent = payload["resources"]["cpu"]["percent"]
        health_score = payload["health"]["score"]

        items = [
            {
                "title": "Auto-start local",
                "description": "Scripts de inicializacao ja estao prontos para subir o servidor ao logar no Windows."
                if START_SCRIPT_PATH.exists() and TASK_SCRIPT_PATH.exists()
                else "Scripts de inicializacao ainda nao foram gerados no projeto.",
                "status_label": "pronto" if START_SCRIPT_PATH.exists() and TASK_SCRIPT_PATH.exists() else "setup",
            },
            {
                "title": "Sincronizacao Google",
                "description": "Conta conectada para liberar evolucao de tarefas, agenda e integrações pessoais."
                if google_status["connected"]
                else google_status["message"],
                "status_label": "ativo" if google_status["connected"] else google_status["badge"],
            },
            {
                "title": "Revisao de armazenamento",
                "description": f"Disco principal em {round(disk_percent)}%. Vale rodar limpeza antes de ficar no limite."
                if disk_percent >= 80
                else "Espaco ainda confortavel. Nenhuma limpeza imediata recomendada.",
                "status_label": "atencao" if disk_percent >= 80 else "ok",
            },
            {
                "title": "Pulso de performance",
                "description": f"CPU em {round(cpu_percent)}% e score geral em {health_score}%."
                if cpu_percent < 85
                else "Carga elevada. Vale investigar os processos no painel central.",
                "status_label": "ok" if cpu_percent < 85 else "atencao",
            },
        ]

        return {"items": items}


collector = MetricsCollector()
google_integration = GoogleIntegration()
automation_engine = AutomationEngine()


class MonitorRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        try:
            parsed = urllib.parse.urlparse(self.path)
            route = parsed.path

            if route in {"/api/system", "/api/system/"}:
                self._send_json(self._dashboard_payload())
                return

            if route == "/api/integrations/google/status":
                self._send_json(google_integration.status_payload(self._base_url()))
                return

            if route == "/auth/google/start":
                auth_url = google_integration.start_authorization()
                if not auth_url:
                    self._send_html("Google nao configurado", 400)
                    return

                self.send_response(302)
                self.send_header("Location", auth_url)
                self.end_headers()
                return

            if route == "/auth/google/callback":
                success, message = google_integration.handle_callback(urllib.parse.parse_qs(parsed.query))
                title = "Google conectado" if success else "Falha no login Google"
                self._send_html(f"<h1>{title}</h1><p>{message}</p><p>Voce pode voltar para o dashboard.</p>", 200 if success else 400)
                return

            self._send_json({"error": "not_found"}, status=404)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            return

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._write_headers()
        self.end_headers()

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _dashboard_payload(self) -> dict[str, Any]:
        payload = collector.collect()
        google_status = google_integration.status_payload(self._base_url())
        payload["integrations"] = {"google": google_status}
        payload["automations"] = automation_engine.build(payload, google_status)
        return payload

    def _base_url(self) -> str:
        return f"http://{HOST}:{PORT}"

    def _send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        try:
            self.send_response(status)
            self._write_headers()
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            return

    def _send_html(self, html: str, status: int) -> None:
        body = (
            "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>Monitor Hub</title>"
            "<style>body{font-family:Segoe UI,Arial,sans-serif;background:#07111f;color:#f4f7ff;padding:40px}"
            "h1{margin:0 0 12px}p{color:#b9c7e4;max-width:60ch}</style></head><body>"
            f"{html}</body></html>"
        ).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _write_headers(self) -> None:
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")


def ensure_example_config() -> None:
    if CONFIG_EXAMPLE_PATH.exists():
        return

    example = {
        "google": {
            "client_id": "SEU_CLIENT_ID_AQUI",
            "client_secret": "SEU_CLIENT_SECRET_AQUI",
            "redirect_uri": f"http://{HOST}:{PORT}/auth/google/callback",
            "scopes": ["openid", "email", "profile"],
        }
    }
    write_json(CONFIG_EXAMPLE_PATH, example)


def main() -> None:
    ensure_example_config()
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), MonitorRequestHandler)
    print(f"Monitor server running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()