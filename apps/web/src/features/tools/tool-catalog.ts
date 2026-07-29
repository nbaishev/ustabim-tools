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
  icon: LucideIcon;
  href?: string;
};

export const plannedTools: ToolDefinition[] = [
  {
    title: "IFC-просмотрщик",
    description:
      "Просмотр структуры, свойств и геометрии BIM-моделей прямо в браузере.",
    icon: Box,
  },
  {
    title: "ИИ-ассистент",
    description:
      "Помощь в работе с инженерными данными и проектной документацией.",
    icon: Bot,
    href: "/app/chat",
  },
  {
    title: "Анализ геологии",
    description:
      "Предварительное извлечение данных из геологических PDF-отчётов.",
    icon: FileSearch,
    href: "/app/geology",
  },
  {
    title: "Инженерные калькуляторы",
    description:
      "Версионированные расчётные инструменты с понятными исходными данными.",
    icon: Calculator,
    href: "/app/calculators",
  },
];
