# UstaBIM Tools

Проект содержит архитектурную документацию и запускаемый frontend-прототип. Общий контекст и границы системы описаны в `README.md` и каталоге `docs/`.

До отдельной задачи не создавайте backend-бизнес-логику, миграции, workflow, настоящую авторизацию или CI/CD. Не добавляйте зависимости без явной необходимости и сохраняйте честный статус UI-заглушек.

Базовые проверки изменений:

```bash
find . -maxdepth 4 -type f | sort
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
docker compose config
git diff --check
```
