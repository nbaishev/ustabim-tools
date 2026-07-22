import {
  Bot,
  Box,
  Calculator,
  FileSearch,
  type LucideIcon,
} from "lucide-react";

export type ToolDefinition = {
  title: string;
  description: string;
  status: "planned" | "development" | "available";
  icon: LucideIcon;
  href?: string;
};

export const plannedTools: ToolDefinition[] = [
  {
    title: "IFC-просмотрщик",
    description:
      "Просмотр структуры, свойств и геометрии BIM-моделей прямо в браузере.",
    status: "development",
    icon: Box,
  },
  {
    title: "ИИ-ассистент",
    description:
      "Помощь в работе с инженерными данными и проектной документацией.",
    status: "development",
    icon: Bot,
    href: "/app/chat",
  },
  {
    title: "Анализ геологии",
    description:
      "Предварительное извлечение данных из геологических PDF-отчётов.",
    status: "development",
    icon: FileSearch,
  },
  {
    title: "Инженерные калькуляторы",
    description:
      "Версионированные расчётные инструменты с понятными исходными данными.",
    status: "development",
    icon: Calculator,
  },
];
