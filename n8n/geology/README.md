# UstaBIM Geology MVP workflows

Это изолированный MVP без проектов, Supabase Storage и прикладных геологических таблиц. Он не меняет исходные GeoAnalyzator WF-1/WF-2: в n8n создайте их **копии** с именами `UstaBIM Geology MVP · Upload` и `UstaBIM Geology MVP · Worker`.

## Переменные окружения n8n

```dotenv
USTABIM_INTERNAL_SECRET=same-random-secret-as-nextjs
GEOLOGY_MVP_INPUT_DIR=/tmp/ustabim-geology/input
GEOLOGY_MVP_OUTPUT_DIR=/tmp/ustabim-geology/output
GEOANALYZATOR_URL=http://geoanalyzator:8000/extract
```

Директории должны быть доступны и n8n, и FastAPI. Создайте Data Tables `geo_mvp_jobs`, `geo_mvp_quota` и `geo_mvp_webhook_nonces`. В `geo_mvp_quota` добавьте единственную запись `{ key: "global", generations_left: 3 }`.

`geo_mvp_jobs`: `jobId`, `tokenHash`, `status`, `inputPath`, `outputPath`, `quotaReserved`, `createdAt`, `updatedAt`, `errorCode`.
`geo_mvp_webhook_nonces`: `nonce` (unique), `expiresAt`.

## Upload workflow

Webhook `POST /ustabim-geology-upload` принимает bytes PDF. До записи файла Code node выполняет [verify-upload.js](./verify-upload.js), затем Data Table проверяет/сохраняет nonce. HMAC строится по JSON-строке `{filename,mimeType,sha256}`, где значения берутся из `X-Usta-File-Name`, `Content-Type`, `X-Usta-Content-SHA256`.

После проверки:

1. Атомарно уменьшите `generations_left`, только когда он больше нуля; при нуле ответьте `429` с `{"error":{"code":"QUOTA_EXHAUSTED"}}`.
2. Сгенерируйте opaque `jobId` и `jobAccessToken`, сохраните только SHA-256 хеш токена.
3. Запишите body в `${GEOLOGY_MVP_INPUT_DIR}/${jobId}.pdf`, создайте `queued` job и ответьте `202`: `{"data":{"jobId":"…","jobAccessToken":"…","status":"queued"}}`.

## Worker workflow

Каждые 15 секунд атомарно забирайте только одну `queued` задачу (`queued → processing`; условие обновления должно включать старый статус). Вызовите `GEOANALYZATOR_URL` с текущим контрактом:

```json
{ "job_id": "…", "input_path": "…", "output_path": "…", "tariff": "mvp" }
```

При успехе с `status: "done"` установите `done`. При отказе установите `error` и один раз верните зарезервированную генерацию.

В этом же workflow добавьте POST webhooks `/ustabim-geology-status` и `/ustabim-geology-download`. Они проверяют HMAC/nonce тем же алгоритмом для точного raw JSON `{jobId,jobAccessToken}` (см. [verify-job-request.js](./verify-job-request.js)), сверяют SHA-256 capability token с `tokenHash` и не сообщают, существует ли job. Status возвращает только `{"data":{"status":"queued|processing|done|error"}}`; download выдаёт `application/pdf` только для `done`.

Hourly cleanup удаляет job и input/output файлы только старше 24 часов; nonce можно удалять сразу после `expiresAt`.

В production ограничьте webhooks HTTPS, не записывайте токены, body PDF или HMAC secret в execution logs.
