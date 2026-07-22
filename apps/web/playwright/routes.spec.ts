import { expect, test, type Page } from "@playwright/test";

function captureBrowserErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

test("главная страница показывает четыре будущих инструмента и навигацию", async ({
  page,
}) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Инженерные задачи в одном рабочем пространстве",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("tool-card")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Войти" }).first()).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(
    page.getByRole("link", { name: "Открыть инструменты" }).first(),
  ).toHaveAttribute("href", "/app");

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});

test("страница входа безопасно обрабатывает отсутствие Supabase", async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  const externalAuthRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isExternalAuth =
      url.hostname.endsWith(".supabase.co") ||
      /google.*oauth|n8n/i.test(`${url.hostname}${url.pathname}`);

    if (isExternalAuth) {
      externalAuthRequests.push(request.url());
    }
  });

  await page.goto("/login");

  await expect(
    page.getByRole("heading", { level: 1, name: "Вход в UstaBIM Tools" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Пароль")).toHaveAttribute("type", "password");
  await expect(
    page.getByRole("button", { name: "Продолжить с Google" }),
  ).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Забыли пароль?" })).toHaveAttribute(
    "href",
    "/forgot-password",
  );

  await page.getByLabel("Email").fill("engineer@example.com");
  await page.getByLabel("Пароль").fill("not-a-real-password");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText(
      "Supabase не настроен или временно недоступен. Проверьте конфигурацию проекта.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Пароль")).toHaveValue("");
  expect(externalAuthRequests).toEqual([]);
  expect(browserErrors).toEqual([]);
});

test("восстановление пароля не раскрывает данные без конфигурации", async ({
  page,
}) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto("/forgot-password");

  await expect(
    page.getByRole("heading", { level: 1, name: "Восстановление пароля" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill("engineer@example.com");
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(
    page.getByText(/Supabase не настроен или временно недоступен/),
  ).toBeVisible();

  await page.goto("/reset-password");
  await expect(page).toHaveURL(/\/forgot-password\?error=invalid-link$/);
  await expect(page.getByText(/Ссылка недействительна или истекла/)).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("кабинет перенаправляет пользователя без сессии на вход", async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto("/app");

  await expect(page).toHaveURL(
    /\/login\?next=%2Fapp&reason=not-configured$/,
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Вход в UstaBIM Tools" }),
  ).toBeVisible();
  await expect(page.getByText(/Supabase не настроен/)).toBeVisible();

  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  expect(browserErrors).toEqual([]);
});
