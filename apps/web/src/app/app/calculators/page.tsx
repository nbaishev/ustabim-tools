import { Calculator, ChevronRight, LandPlot } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const calculators = [
  { title: "Балка на двух опорах", description: "Реакции, усилия и прогиб шарнирно-опёртой балки под равномерной нагрузкой.", href: "/app/calculators/beam", icon: Calculator },
  { title: "Давление ленточного фундамента", description: "Давление под подошвой и сравнение с введённым сопротивлением грунта.", href: "/app/calculators/strip-foundation", icon: LandPlot },
];

export default function CalculatorsPage() {
  return <div className="mx-auto max-w-5xl"><Badge variant="secondary">Предварительная проверка</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Инженерные калькуляторы</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">Выберите расчётную схему. Все результаты требуют инженерной проверки.</p><section aria-label="Список калькуляторов" className="mt-8 space-y-4">{calculators.map(({ title, description, href, icon: Icon }) => <Link key={href} href={href} className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><Card className="transition hover:border-blue-300 hover:bg-blue-50/50"><CardHeader className="flex-row items-center gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><CardTitle>{title}</CardTitle><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div><ChevronRight className="size-5 shrink-0 text-slate-400" /></CardHeader></Card></Link>)}</section></div>;
}
