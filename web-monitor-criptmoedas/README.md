# Crypto Pulse

Painel estatico em HTML, CSS e JavaScript puro para acompanhar criptomoedas, filtrar ativos, marcar favoritos e criar alertas locais de preco com persistencia em localStorage e notificacoes do navegador.

## O que foi organizado

- HTML semantico com secoes separadas para destaque, filtros, mercado e alertas.
- JavaScript modularizado em configuracao, acesso a API, armazenamento, notificacoes e renderizacao.
- CSS refeito com abordagem mobile first e responsividade real para telas pequenas e desktop.
- Manifesto web com favicon e icones proprios para a instalacao e para as notificacoes.
- Lista ampliada de moedas: BTC, ETH, SOL, XRP, ADA, DOGE, LTC, LINK, DOT, AVAX, TRX e XLM.

## Funcionalidades

- Consulta de cotacoes em USD com atualizacao manual e automatica.
- Busca por nome ou simbolo.
- Filtros de ativos em alta, em queda, favoritos e com alertas cadastrados.
- Favoritos persistentes em localStorage.
- Alertas persistentes em localStorage.
- Notificacoes do navegador quando o preco cruza o alvo definido.
- Mini sparklines em SVG puro para mostrar o historico recente de cada moeda.

## Estrutura

```text
index.html
manifest.webmanifest
sw.js
src/
  js/
    config.js
    main.js
    services/
      market-api.js
      notifications.js
      storage.js
    ui.js
  styles/
    style.css
assets/
  app-icon.svg
  favicon.svg
  notification-badge.svg
```

## Como executar

Como a aplicacao registra um service worker para exibir notificacoes, rode em HTTP local em vez de abrir o arquivo direto.

### Python

```bash
python -m http.server 4173
```

Depois acesse `http://127.0.0.1:4173/`.

## Observacao importante

As notificacoes funcionam inteiramente no cliente. Nao existe backend, entao nao ha Web Push real com envio remoto; os alertas sao verificados no navegador enquanto a pagina estiver aberta e atualizando as cotacoes.
