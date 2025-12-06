"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Operation {
  id: string
  date: string
  time: string
  title: string
  category: string
  description: string
  amount: number
  card: string
  icon: string
}

const operations: Operation[] = [
  {
    id: "1",
    date: "Сегодня",
    time: "14:30",
    title: "ВкусВилл",
    category: "Еда",
    description: "Продукты для дома",
    amount: -2450,
    card: "CARD • 4291",
    icon: "🛒",
  },
  {
    id: "2",
    date: "Вчера",
    time: "10:00",
    title: "Зарплата",
    category: "Зарплата",
    description: "Tech Corp LLC",
    amount: 125000,
    card: "CARD • 4291",
    icon: "💰",
  },
  {
    id: "3",
    date: "Вчера",
    time: "09:15",
    title: "Uber",
    category: "Транспорт",
    description: "Поездка в офис",
    amount: -450,
    card: "CARD • 4291",
    icon: "🚗",
  },
  {
    id: "4",
    date: "22 Окт",
    time: "19:09",
    title: "Netflix",
    category: "Развлечения",
    description: "Ежемесячная подписка",
    amount: -890,
    card: "CARD • 4291",
    icon: "📺",
  },
  {
    id: "5",
    date: "21 Окт",
    time: "18:40",
    title: "Аптека",
    category: "Здоровье",
    description: "Витамины",
    amount: -1200,
    card: "CARD • 4291",
    icon: "🍌",
  },
  {
    id: "6",
    date: "21 Окт",
    time: "08:39",
    title: "Кофейня №1",
    category: "Еда",
    description: "Латте и круассан",
    amount: -650,
    card: "CARD • 4291",
    icon: "☕",
  },
  {
    id: "7",
    date: "20 Окт",
    time: "12:08",
    title: "Сбербанк",
    category: "Кэшбэк",
    description: "Кэшбэк за сентябрь",
    amount: 1450,
    card: "CARD • 4291",
    icon: "🏦",
  },
  {
    id: "8",
    date: "19 Окт",
    time: "08:50",
    title: "Метро",
    category: "Транспорт",
    description: "Пополнение тройки",
    amount: -500,
    card: "CARD • 4291",
    icon: "🚇",
  },
]

export function OperationsList() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {operations.map((operation) => (
          <div key={operation.id} className="p-6 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Date, Time, Icon */}
              <div className="flex items-center gap-4 min-w-[120px]">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{operation.date}</div>
                  <div className="text-xs text-muted-foreground">{operation.time}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {operation.icon}
                </div>
              </div>

              {/* Middle: Title, Category, Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{operation.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {operation.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{operation.description}</p>
              </div>

              {/* Right: Amount and Card */}
              <div className="text-right min-w-[140px]">
                <div
                  className={`text-lg font-semibold mb-0.5 ${
                    operation.amount > 0 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {operation.amount > 0 ? "+" : ""}
                  {operation.amount.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-xs text-muted-foreground">{operation.card}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      <div className="p-6 border-t border-border bg-muted/30">
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
          Загрузить больше
        </Button>
      </div>
    </div>
  )
}
