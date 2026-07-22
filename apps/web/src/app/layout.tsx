import type { Metadata } from "next";

import "./globals.css";

import { publicEnv } from "@/shared/config/env";

export const metadata: Metadata = {
  title: publicEnv.NEXT_PUBLIC_APP_NAME,
  description: "Инженерные инструменты для BIM и строительства",
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <div className="min-h-screen overflow-x-hidden">{children}</div>
      </body>
    </html>
  );
}
