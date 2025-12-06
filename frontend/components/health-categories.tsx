import { Card } from "@/components/ui/card"
import { Wallet, CreditCard, PiggyBank, TrendingUp, Building2 } from "lucide-react"

export function HealthCategories() {
  const categories = [
    {
      id: 1,
      title: "Доходы",
      amount: "120 000 ₽",
      status: "Норма накоплений в порядке",
      icon: Wallet,
      color: "bg-primary",
      iconColor: "text-primary-foreground",
    },
    {
      id: 2,
      title: "Расходы",
      amount: "85 000 ₽",
      status: "Баланс расходов в норме",
      icon: CreditCard,
      color: "bg-blue-500",
      iconColor: "text-white",
    },
    {
      id: 3,
      title: "Накопления",
      amount: "45 000 ₽",
      badge: "Подушка: 1.2 мес",
      status: "Финансовая подушка требует внимания",
      icon: PiggyBank,
      color: "bg-orange-500",
      iconColor: "text-white",
    },
    {
      id: 4,
      title: "Инвестиции",
      amount: "80 000 ₽",
      badge: "+5% прибыли",
      status: "Отличная доходность портфеля",
      icon: TrendingUp,
      color: "bg-purple-500",
      iconColor: "text-white",
    },
    {
      id: 5,
      title: "Вклады",
      amount: "100 000 ₽",
      badge: "+7,500₽ доход",
      status: "Вклады - надежный инструмент",
      icon: Building2,
      color: "bg-blue-600",
      iconColor: "text-white",
    },
  ]

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Card key={category.id} className="p-6">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${category.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm text-muted-foreground">
                    {category.id}. {category.title}
                  </span>
                  {category.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted rounded">
                      {category.badge}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-foreground">{category.amount}</div>
              </div>

              {/* Status */}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{category.status}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
