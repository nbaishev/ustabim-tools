# UstaBIM Tools

UstaBIM Tools — самостоятельный инженерный веб-сервис для будущей работы с BIM-моделями, расчётами и инженерными документами. Планируемый адрес: `https://tools.ustabim.online`.

Сейчас в репозитории реализован запускаемый frontend-прототип на Next.js, подключение Supabase SDK, регистрация с подтверждением email, вход по email/паролю и Google OAuth, восстановление пароля через одноразовую PKCE-ссылку, read-only профиль Auth-пользователя, frontend проектов, локальный IFC-просмотрщик, frontend ИИ-чата и frontend анализа геологии. `/app` и форма нового пароля защищены проверенной cookie-сессией. Запросы к прикладным таблицам, AI backend, расчёты и серверная обработка файлов ещё не реализованы.

> Инженерные расчёты и результаты автоматизированного анализа являются вспомогательными и должны проверяться квалифицированным специалистом.

## Доступные маршруты прототипа

| Маршрут | Назначение |
|---|---|
| `/` | Главная страница и планируемые инструменты |
| `/login` | Вход существующего пользователя через Supabase Auth |
| `/register` | Регистрация с обязательным подтверждением email |
| `/register/check-email` | Нейтральное подтверждение отправки signup-письма |
| `/forgot-password` | Запрос письма для восстановления пароля |
| `/forgot-password/check-email` | Нейтральное подтверждение отправки recovery-письма |
| `/reset-password` | Защищённая форма нового пароля после callback |
| `/app` | Защищённый каркас личного кабинета |
| `/app/projects` | Защищённый список и создание проектов в Supabase |
| `/app/projects/{projectId}` | Защищённая карточка доступного проекта |
| `/app/profile` | Защищённый профиль с актуальными данными Supabase Auth |
| `/app/ifc` | Защищённый локальный просмотр IFC в браузере |
| `/app/chat` | Защищённый ИИ-чат с серверным webhook в отдельный n8n workflow |
| `/app/geology` | Защищённый frontend анализа геологических PDF без worker |

Маршрут `/app` доступен только при подтверждённых Supabase claims. Формы регистрации и входа передают email и пароль напрямую публичному Supabase Auth API через официальный SDK; пароль не проходит через API UstaBIM Tools и очищается из формы после попытки. Google OAuth также запускается через Supabase и возвращается в серверный PKCE callback; Google Client Secret не попадает в приложение. Успешная email-регистрация и попытка с существующим email ведут на один нейтральный экран, не раскрывая существование аккаунта. Ошибки SMTP, отключённого провайдера, OAuth и rate limit остаются на форме в безопасном виде. После выхода сессия удаляется и пользователь возвращается на `/login`.

Восстановление пароля не сообщает, зарегистрирован ли введённый email. После принятого запроса пользователь переходит на нейтральный экран проверки почты без email в URL. Ссылка из письма возвращается на `/auth/callback`, где одноразовый PKCE code обменивается на recovery-сессию. После успешной смены пароля сессия завершается и требуется повторный вход.

В кабинете доступна ручная проверка соединения с Supabase. Она обращается к локальному `/api/health/supabase`, а сервер проверяет официальный Auth health endpoint и возвращает только статус без URL проекта, ключа или технического ответа.

IFC-просмотрщик использует That Open Components и web-ifc. Пользователь выбирает локальный `.ifc`, файл проверяется по размеру и STEP-заголовку, преобразуется в Fragments и отображается в WebGL-сцене. На текущем этапе файл не отправляется в Supabase Storage или IFC worker. Доступны орбитальная камера, сетка, вписывание модели, выбор и подсветка элементов, пространственное дерево, атрибуты и property sets, измерение расстояний, осевые плоскости разреза и инверсия стороны отсечения. Лимит локального файла — 250 МБ; единицы линейки соответствуют нормализованной геометрии IFC и отображаются в метрах.

Frontend ИИ-чата предоставляет адаптивный интерфейс со списком диалогов, стартовыми запросами и формой сообщения. `POST /api/chat/message` проверяет Supabase-сессию, подписывает внутренний запрос HMAC-SHA256 и отправляет только `{ message }` в отдельный HTTPS webhook n8n. История, вложения, проектный контекст и сохранение сообщений пока не реализованы.

Frontend геологии повторяет основной сценарий профильного сервиса: выбор PDF-отчёта ИГИ, описание этапов обработки и рабочая область будущего результата со сводкой, ИГЭ, скважинами, параметрами и рисками. PDF проверяется локально по расширению, MIME, непустому содержимому и предварительному лимиту 100 МБ, но не отправляется на сервер. Кнопка анализа явно сообщает об отсутствии проектов, Storage и geology workflow.

Frontend проектов создаёт и показывает доступные проекты через `/api/projects`. Миграция создаёт `projects` и `project_members`: автор становится владельцем автоматически, а RLS разрешает пользователю видеть только собственные и совместные проекты. Перед использованием примените миграцию Supabase из `supabase/migrations/`.

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

Во время `npm install` скрипт копирует согласованные версии `web-ifc.wasm` и Fragments worker из зависимостей в игнорируемый каталог `apps/web/public/ifc-runtime`. Если runtime нужно обновить вручную, выполните `npm run sync:ifc-runtime --workspace=apps/web`.

Для реальной проверки Supabase заполните в `apps/web/.env.local` значения из Connect dialog проекта:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Если оба значения пусты, приложение продолжает работать и показывает статус «Не настроено». Частично заполненная или некорректная конфигурация отображается как ошибка настройки. Service role key на этом этапе не используется.

Для веб-чата дополнительно заполните серверные переменные:

```dotenv
N8N_CHAT_WEBHOOK_URL=https://your-n8n.example/webhook/ustabim-chat
N8N_INTERNAL_SECRET=replace-with-random-secret-at-least-32-characters
```

Тот же секрет должен быть доступен в окружении n8n как `USTABIM_INTERNAL_SECRET`. `OPENAI_API_KEY` хранится только в credentials или environment n8n и не передаётся в Next.js.

Для регистрации включите в Supabase Dashboard подтверждение email (Authentication → Sign In / Providers → Email → Confirm email). Для ручной проверки используйте отдельный тестовый адрес и не используйте производственную учётную запись.

### Настройка Google OAuth

1. В Google Auth Platform создайте OAuth Client с типом **Web application**.
2. В **Authorized JavaScript origins** добавьте `http://localhost:3000` и production origin `https://tools.ustabim.online`.
3. В **Authorized redirect URIs** добавьте callback, показанный в Supabase Dashboard → Authentication → Sign In / Providers → Google. Он имеет вид `https://<project-ref>.supabase.co/auth/v1/callback`. Это callback Supabase для Google, а не маршрут Next.js.
4. Скопируйте Google Client ID и Client Secret в Supabase Dashboard → Authentication → Sign In / Providers → Google и включите провайдер.
5. В Supabase Dashboard → Authentication → URL Configuration → Redirect URLs разрешите маршруты приложения:

```text
http://localhost:3000/auth/callback
https://tools.ustabim.online/auth/callback
```

Название, которое пользователь видит в окне согласия Google, задаётся в Google Auth Platform → **Branding** → **App information** → **App name**. Имя самого OAuth Client на это окно не влияет. Там же укажите email поддержки, логотип и разрешённые домены; публикация нового брендинга может потребовать проверки Google.

Google Client Secret хранится только в Supabase. Добавлять его в `.env.local` или публичные переменные Next.js не нужно.

Стандартный почтовый сервис Supabase предназначен только для демонстрации и отправляет письма лишь на предварительно разрешённые адреса участников команды проекта. Для проверки с произвольными адресами настройте Authentication → Emails → SMTP Settings и проверяйте ошибки доставки в Auth logs и логах SMTP-провайдера.

Те же разрешённые маршруты `/auth/callback` используются для email signup и recovery flow. Production URL добавляйте только перед развёртыванием соответствующего домена. Отправка писем использует SMTP-настройки Supabase; встроенный тестовый отправитель имеет строгие лимиты.

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
n8n/                      Workflow-артефакты чата и заготовки геологии
supabase/                 Каталоги будущих миграций и seed-данных
docs/                     Архитектурная и контрактная документация
docker-compose.yml        Заготовка будущей локальной инфраструктуры
```

Frontend использует Next.js App Router, React, TypeScript, Tailwind CSS, минимальный набор локальных компонентов shadcn/ui, официальные пакеты Supabase и связку That Open Components / web-ifc / Three.js. Browser client выполняет регистрацию, вход и выход, Next.js auth callback обменивает одноразовые PKCE codes на cookie-сессии, proxy защищает `/app`, а server layout повторно проверяет claims перед отображением кабинета. Профиль запрашивает актуальную запись пользователя у Supabase Auth через server client и не требует отдельной таблицы. IFC-файл обрабатывается только в браузере; проекты и геология пока остаются frontend-интерфейсами, а чат использует отдельный серверный webhook в n8n без сохранения истории. Unit-тесты выполняются Vitest и React Testing Library, маршруты проверяются Playwright в Chromium.

Подробные границы системы:

- [Архитектура](docs/architecture.md)
- [Модель данных](docs/data-model.md)
- [API-контракты](docs/api-contracts.md)
- [Статусы](docs/statuses.md)
- [Безопасность](docs/security.md)
- [Тестирование](docs/testing.md)

## Что пока является заглушкой

Не реализованы приглашения и управление совместным доступом проектов, повторная отправка письма подтверждения, хранение истории и вложений чата, скрытие/изоляция IFC-элементов, сохранённые виды, geology workflow, workers, загрузка PDF/IFC в Storage, серверное извлечение геологических данных и калькуляторы. Для чата реализован только синхронный защищённый вызов отдельного n8n webhook без памяти, RAG и project context. Supabase используется для проверки доступности, email-аутентификации, Google OAuth и проектов. Существующий сайт `ustabim.online` не изменяется.

## Будущая инфраструктура

Локальные n8n, PostgreSQL и Redis описаны отдельным Compose-профилем и не нужны для frontend-прототипа:

```bash
docker compose --profile automation up
```

Supabase локально на этом этапе не запускается.
