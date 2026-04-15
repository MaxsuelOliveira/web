# Servidor local do player

Execute o projeto com:

```powershell
python scripts/server.py
```

O player ficará disponível em `http://127.0.0.1:5500`.

Variáveis opcionais:

- `PLAYER_HOST` para alterar o host
- `PLAYER_PORT` para alterar a porta

Healthcheck:

- `http://127.0.0.1:5500/health`
