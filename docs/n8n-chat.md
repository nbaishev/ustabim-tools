# n8n: веб-чат UstaBIM Tools

Веб-приложение не вызывает n8n из браузера. Оно проверяет Supabase-сессию и выполняет серверный `POST` на отдельный HTTPS webhook. Не добавляйте этот webhook в существующий Telegram workflow.

## Переменные

В окружении Next.js задайте `N8N_CHAT_WEBHOOK_URL` и `N8N_INTERNAL_SECRET` (случайное значение не короче 32 символов). Тот же секрет задайте в окружении n8n как `USTABIM_INTERNAL_SECRET`. `OPENAI_API_KEY` остаётся только в credentials/environment n8n.

## Workflow

Создайте отдельный workflow: `Webhook (POST)` → `Code: verify request` → `Data Table: get nonce` → `IF` → `Data Table: insert nonce` → `OpenAI` → `Respond to Webhook`. В ветке уже существующего nonce сразу используйте отдельный `Respond to Webhook` со статусом `401`.

Webhook получает JSON `{ "message": "..." }` и заголовки `X-Usta-Timestamp`, `X-Usta-Nonce`, `X-Usta-Signature`. В Code node до OpenAI:

1. Получите raw JSON как `JSON.stringify({ message: $json.body.message })`.
2. Проверьте, что Unix timestamp отличается от текущего не более чем на 300 секунд.
3. Вычислите hex HMAC-SHA256 для строки `timestamp.nonce.rawJson` с `USTABIM_INTERNAL_SECRET` и сравните с заголовком безопасным сравнением.
4. Передайте только `message`, `nonce` и `expiresAt` в следующий узел. `Data Table: get nonce` проверяет таблицу `ustabim_webhook_nonces`; если nonce уже существует и ещё не истёк, немедленно верните `401`. Иначе `Data Table: insert nonce` сохраняет nonce и `expiresAt = now + 5 minutes` до OpenAI. Периодически удаляйте записи после истечения срока.

При любой ошибке проверки сразу ответьте `401` и не запускайте OpenAI. Узел OpenAI получает только поле `message`, без пользователя, проекта и файлов. Системный промпт:

> Ты помощник по нормативной документации Казахстана. Не выдумывай численные требования, редакции документов или ссылки на пункты. Если нет надёжного первичного источника или актуальной редакции, прямо скажи, что не можешь подтвердить значение, и попроси документ либо его реквизиты. Любой ответ требует сверки профильным специалистом.

`Respond to Webhook` при успехе должен вернуть статус `200` и ровно `{ "data": { "answer": "текст ответа" } }`. Ошибки модели возвращайте безопасно, без текста OpenAI, ключей, stack trace или внутреннего URL.
