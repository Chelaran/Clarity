import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const transactions = [
  {
    date: "Сегодня",
    name: "ВкусВилл",
    category: "Продукты",
    amount: -2450,
    icon: "🏪",
  },
  {
    date: "Вчера",
    name: "Зарплата",
    category: "Tech Corp LLC",
    amount: 125000,
    icon: "💰",
  },
  {
    date: "Вчера",
    name: "Uber",
    category: "Поездка",
    amount: -450,
    icon: "🚗",
  },
  {
    date: "22 Окт",
    name: "Netflix",
    category: "Подписка",
    amount: -890,
    icon: "📺",
  },
  {
    date: "21 Окт",
    name: "Аптека",
    category: "Здоровье",
    amount: -1200,
    icon: "💊",
  },
]

export function TransactionHistory() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">История операций</h2>
        <Button variant="link" className="text-primary text-sm p-0 h-auto">
          Показать все
        </Button>
      </div>

      <div className="space-y-1">
        {transactions.map((transaction, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                {transaction.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{transaction.name}</p>
                <p className="text-xs text-muted-foreground">{transaction.category}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">{transaction.date}</p>
              <p className={`text-sm font-semibold ${transaction.amount > 0 ? "text-success" : "text-foreground"}`}>
                {transaction.amount > 0 ? "+" : ""}
                {transaction.amount.toLocaleString()} ₽
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="w-full mt-4 text-muted-foreground">
        Загрузить больше
      </Button>
    </Card>
  )
}
