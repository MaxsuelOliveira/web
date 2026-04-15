# Ferramentas Online

Aplicacao web com catalogo de ferramentas para produtividade tecnica.

O projeto esta organizado como monorepo simples com dois workspaces:

- `frontend`: interface em React + Vite + Tailwind CSS
- `backend`: API em Express para ferramentas que dependem de rede, DNS, HTTP e servicos externos

## Objetivo

Entregar uma base funcional e simples para:

- consultas de dados externos
- utilitarios de texto
- geradores de conteudo e identificadores
- ferramentas de teste e validacao

## Stack

- Node.js
- React 18
- React Router
- Vite
- Tailwind CSS v4
- Express

## Estrutura

```text
.
|-- backend/
|   |-- src/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- modules/
|   |   `-- assets/
|-- package.json
`-- README.md
```

## Responsabilidades

### Frontend

Responsavel por:

- catalogo e navegacao
- renderizacao das views de ferramenta
- tema e experiencia visual
- execucao local de ferramentas de texto e geracao

Arquivos centrais:

- `frontend/src/app/App.jsx`
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/modules/catalog/tools.js`

### Backend

Responsavel por:

- endpoint de saude
- endpoint unico de execucao de ferramentas remotas
- integracao com APIs externas
- operacoes de DNS, SSL e HTTP

Arquivos centrais:

- `backend/src/app.js`
- `backend/src/routes/tools.routes.js`
- `backend/src/services/toolService.js`

## Scripts

Na raiz:

- `npm run dev:frontend`: sobe o frontend em desenvolvimento
- `npm run dev:backend`: sobe o backend em desenvolvimento
- `npm run build`: gera o build do frontend
- `npm run start`: sobe o backend em modo normal

Nos workspaces:

- `frontend`: `npm run dev`, `npm run build`, `npm run preview`
- `backend`: `npm run dev`, `npm run start`

## Como executar

### 1. Instalar dependencias

```bash
npm install
```

### 2. Rodar backend

```bash
npm run dev:backend
```

Backend padrao:

- `http://localhost:3001`

### 3. Rodar frontend

```bash
npm run dev:frontend
```

Frontend padrao:

- `http://localhost:5173`

## API atual

### Healthcheck

`GET /api/health`

### Execucao de ferramenta

`POST /api/tools/execute`

Payload esperado:

```json
{
  "toolId": "dnsA",
  "payload": {
    "host": "openai.com"
  }
}
```

## Estado atual da arquitetura

O projeto ja esta funcional, mas ainda tem dois pontos que concentram muita responsabilidade:

- `frontend/src/components/layout/AppShell.jsx`
- `backend/src/services/toolService.js`

A fase atual de trabalho foca em:

- documentacao minima
- separacao de responsabilidades
- base de tema mais sustentavel
- reducao de acoplamento entre catalogo, layout e execucao

## Proximas fases

### Fase 1

- documentar scripts e arquitetura
- reorganizar layout e servicos concentrados
- consolidar base de tema

### Fase 2

- estabilizar fluxo catalogo vs ferramenta
- revisar UX de formularios e respostas
- padronizar feedback de erro e loading

### Fase 3

- melhorar integracao frontend/backend
- tratar falhas externas com mais consistencia
- preparar configuracao por ambiente

### Fase 4

- adicionar testes essenciais
- revisar acessibilidade e responsividade
- fechar documentacao final
