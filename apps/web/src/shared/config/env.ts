import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
});

const result = publicEnvSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!result.success) {
  const fields = result.error.issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");

  throw new Error(
    `Некорректные переменные окружения UstaBIM Tools: ${fields || "неизвестная ошибка"}. ` +
      "Создайте .env.local по образцу корневого .env.example.",
  );
}

export const publicEnv = result.data;
