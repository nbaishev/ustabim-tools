# UstaBIM Tools

UstaBIM Tools — самостоятельный инженерный веб-сервис для будущей работы с BIM-моделями, расчётами и инженерными документами. Планируемый адрес: `https://tools.ustabim.online`.

Сейчас в репозитории реализован запускаемый frontend-прототип на Next.js, подключение Supabase SDK, вход существующего пользователя по email/паролю и восстановление пароля через одноразовую PKCE-ссылку. `/app` и форма нового пароля защищены проверенной cookie-сессией. Запросы к прикладным таблицам, расчёты и обработка файлов ещё не реализованы.

> Инженерные расчёты и результаты автоматизированного анализа являются вспомогательными и должны проверяться квалифицированным специалистом.

## Доступные маршруты прототипа

| Маршрут | Назначение |
|---|---|
| `/` | Главная страница и планируемые инструменты |
| `/login` | Вход существующего пользователя через Supabase Auth |
| `/forgot-password` | Запрос письма для восстановления пароля |
| `/reset-password` | Защищённая форма нового пароля после callback |
| `/app` | Защищённый каркас личного кабинета |

Маршрут `/app` доступен только при подтверждённых Supabase claims. Форма передаёт email и пароль напрямую публичному Supabase Auth API через официальный SDK; пароль не проходит через API UstaBIM Tools и очищается из формы после попытки. После выхода сессия удаляется и пользователь возвращается на `/login`.

Восстановление пароля не сообщает, зарегистрирован ли введённый email. Ссылка из письма возвращается на `/auth/callback`, где одноразовый PKCE code обменивается на recovery-сессию. После успешной смены пароля сессия завершается и требуется повторный вход.

В кабинете доступна ручная проверка соединения с Supabase. Она обращается к локальному `/api/health/supabase`, а сервер проверяет официальный Auth health endpoint и возвращает только статус без URL проекта, ключа или технического ответа.

## Локальный запуск

Требуется Node.js 22 и npm. Версия Node указана в `.nvmrc`.

```bash
nvm install
nvm use
npm install
cp .env.example apps/web/.env.local
npm run dev
```

После запуска приложение доступно по адресу `http://localhost:3000`.

Для реальной проверки Supabase заполните в `apps/web/.env.local` значения из Connect dialog проекта:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Если оба значения пусты, приложение продолжает работать и показывает статус «Не настроено». Частично заполненная или некорректная конфигурация отображается как ошибка настройки. Service role key на этом этапе не используется.

Регистрация в приложении отсутствует. Для ручной проверки входа используйте отдельного тестового пользователя, заранее созданного в Supabase Dashboard в разделе Authentication → Users. Не используйте производственную учётную запись.

Для recovery flow добавьте в Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:

```text
http://localhost:3000/auth/callback
https://tools.ustabim.online/auth/callback
```

Production URL добавляйте только перед развёртыванием соответствующего домена. Отправка писем использует SMTP-настройки Supabase; встроенный тестовый отправитель имеет строгие лимиты.

## Проверки

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Для первого локального запуска E2E-тестов может потребоваться Chromium:

```bash
npx playwright install chromium
```

Все команды запускаются из корня и перенаправляются в npm workspace `apps/web`.

## Архитектура и структура

```text
apps/web/                  Next.js frontend-прототип и общие TypeScript-типы
services/document-worker/ Заготовка будущего сервиса извлечения данных из PDF
services/ifc-worker/      Заготовка будущей серверной обработки IFC
n8n/                      Каталоги будущих workflow чата и геологии
supabase/                 Каталоги будущих миграций и seed-данных
docs/                     Архитектурная и контрактная документация
docker-compose.yml        Заготовка будущей локальной инфраструктуры
```

Frontend использует Next.js App Router, React, TypeScript, Tailwind CSS, минимальный набор локальных компонентов shadcn/ui и официальные пакеты `@supabase/ssr`/`@supabase/supabase-js`. Browser client выполняет вход и выход, Next.js proxy обновляет cookie и защищает `/app`, а server layout повторно проверяет claims перед отображением кабинета. Unit-тесты выполняются Vitest и React Testing Library, маршруты проверяются Playwright в Chromium.

Подробные границы системы:

- [Архитектура](docs/architecture.md)
- [Модель данных](docs/data-model.md)
- [API-контракты](docs/api-contracts.md)
- [Статусы](docs/statuses.md)
- [Безопасность](docs/security.md)
- [Тестирование](docs/testing.md)

## Что пока является заглушкой

Не реализованы прикладные таблицы и RLS-политики, регистрация, Google OAuth, управление проектами, n8n, OpenAI, IFC-просмотрщик, workers, загрузка PDF/IFC, ИИ-чат, геологический анализ и калькуляторы. Supabase используется для проверки доступности, входа и восстановления пароля существующего пользователя; создание проекта остаётся статической заглушкой. Существующий сайт `ustabim.online` не изменяется.

## Будущая инфраструктура

Локальные n8n, PostgreSQL и Redis описаны отдельным Compose-профилем и не нужны для frontend-прототипа:

```bash
docker compose --profile automation up
```

Supabase локально на этом этапе не запускается.
