# UstaBIM Web Chat Workflow

Этот каталог содержит артефакты для отдельного n8n workflow веб-чата, описанного в [docs/n8n-chat.md](../../docs/n8n-chat.md).

Прямой n8n MCP в текущей сессии недоступен, поэтому workflow подготовлен как набор готовых фрагментов для ручной сборки в n8n.

## Переменные окружения n8n

Задайте в окружении n8n:

```dotenv
USTABIM_INTERNAL_SECRET=replace-with-the-same-secret-from-nextjs
OPENAI_API_KEY=stored-only-in-n8n
```

В Next.js должны быть заданы:

```dotenv
N8N_CHAT_WEBHOOK_URL=https://your-n8n.example/webhook/ustabim-chat
N8N_INTERNAL_SECRET=replace-with-the-same-secret-from-n8n
```

## Структура workflow

Соберите отдельный workflow в таком порядке:

1. `Webhook` с методом `POST` и отдельным путем, например `ustabim-chat`.
2. `Code` с кодом из [verify-request.js](./verify-request.js).
3. `Data Table` чтение nonce из таблицы `ustabim_webhook_nonces` по ключу `nonce`.
4. `IF`:
   условие истинно, если запись найдена и `expiresAt` больше текущего времени.
5. В ветке `true`:
   `Respond to Webhook` со статусом `401` и безопасным телом `{"error":{"code":"UNAUTHORIZED","message":"Unauthorized"}}`.
6. В ветке `false`:
   `Data Table` вставка записи `nonce` и `expiresAt`.
7. `OpenAI`:
   передавайте только `message` и системный промпт из [openai-system-prompt.txt](./openai-system-prompt.txt).
8. `Respond to Webhook` со статусом `200` и ровно телом `{"data":{"answer":"..."}}`.

При любой ошибке в `Code` node workflow должен завершаться ответом `401` без запуска `OpenAI`.

## Поля webhook-запроса

Next.js отправляет JSON:

```json
{ "message": "..." }
```

И заголовки:

```text
X-Usta-Timestamp
X-Usta-Nonce
X-Usta-Signature
```

## Настройка Code node

Вставьте содержимое [verify-request.js](./verify-request.js) в `Code` node.

Ожидаемое поведение:

- принимает только `body.message`;
- проверяет окно в 300 секунд;
- пересчитывает `HMAC-SHA256(timestamp.nonce.rawJson)`;
- использует безопасное сравнение подписи;
- возвращает только `message`, `nonce`, `expiresAt`.

## Настройка OpenAI node

Минимальная схема:

- model: на ваш выбор в n8n credentials;
- system prompt: содержимое [openai-system-prompt.txt](./openai-system-prompt.txt);
- user message: `{{$json.message}}`.

На выходе до финального `Respond to Webhook` приведите ответ модели к plain text и верните только:

```json
{ "data": { "answer": "текст ответа" } }
```

Не проксируйте наружу stack trace, внутренний URL, тело ошибки OpenAI или n8n credentials.

## Таблица nonce

Создайте Data Table `ustabim_webhook_nonces` c полями:

- `nonce` string, unique
- `expiresAt` datetime

Политика обработки:

- если `nonce` уже есть и срок не истёк, вернуть `401`;
- если записи нет или срок истёк, записать новый `nonce`;
- периодически удалять просроченные записи отдельной задачей n8n или SQL cleanup.
