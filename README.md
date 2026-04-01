# Orquestrador de Pedidos - API NestJS

API em NestJS para ingestão de pedidos via webhook, orquestrada com Redis/Bull e enriquecimento de moeda para BRL usando a API da AwesomeAPI.

## O que a aplicação faz

- Recebe pedidos no endpoint de webhook (`CreateOrderDto`):
  - `order_id`
  - `customer`
  - `items`
  - `currency`
- Publica o pedido na fila `order-process`.
- Worker da `order-process` persiste pedido e itens no SQLite (Prisma).
- Em seguida, envia para a fila `enrichment-process`.
- Worker da `enrichment-process` consulta cotação na `economia.awesomeapi.com.br`, converte os valores dos itens para BRL e atualiza o `currency` do pedido para `BRL`.

## Arquitetura de filas

- **Fila 1: `order-process`**
  - Responsável por criar/persistir o pedido.
- **Fila 2: `enrichment-process`**
  - Responsável por enriquecer os valores e moeda.

Esse desenho separa ingestão de enriquecimento, reduz acoplamento e melhora resiliência com retries configurados no Bull.

## Variáveis de ambiente

Exemplo:

```env
DATABASE_URL=file:./db.sqlite
REDIS_URL=redis://localhost:6379
REDIS_JOB_ATTEMPS=3
REDIS_JOB_BACKOFF_DELAY=3000
AWESOME_API_URL=https://economia.awesomeapi.com.br/last/{currency}-BRL
```

## Como rodar com Docker

Pré-requisito: Docker + Docker Compose.

1. Subir os containers:

```bash
docker compose up -d --build
```

2. A aplicação sobe em:

```text
http://localhost:3000
```

Observações:

- O serviço `app` e o Redis sobem pelo `docker-compose.yml`.
- O container da aplicação executa `prisma migrate deploy` no startup antes de iniciar o NestJS.
- O banco SQLite fica persistido em volume Docker (`/app/data`).

3. Ver logs:

```bash
docker compose logs -f app
```

4. Parar tudo:

```bash
docker compose down
```

5. Parar e remover volumes (reset completo do banco local):

```bash
docker compose down -v
```

## Como rodar local (sem Docker)

```bash
npm install
npm run start:dev
```

## Endpoints principais

- `POST /webhooks/orders` — recebe e enfileira pedido.
- `GET /orders` — lista pedidos (com paginação/filtro quando informado).
- `GET /orders/:id` — busca pedido por id.
- `DELETE /:id` — remove pedido por id.
- `GET /queue/metrics` — consulta métricas das filas.

## Swagger

- Documentação interativa disponível em: `http://localhost:3000/api`

## Exemplo de payload do webhook

```json
{
  "order_id": "ext-123",
  "customer": {
    "email": "user@example.com",
    "name": "Ana"
  },
  "items": [
    {
      "sku": "ABC123",
      "qty": 2,
      "unit_price": 59.9
    }
  ],
  "currency": "USD"
}
```

## Qualidade e automação

- Lint e formato validados no CI (`.github/workflows/ci.yml`).
- `pre-push` com Husky:
  - roda `format`
  - valida limite por módulo de lint (máx. 10 warnings e 5 errors)

## Stack

- NestJS
- Bull + Redis
- Prisma + SQLite
- AwesomeAPI (câmbio)
