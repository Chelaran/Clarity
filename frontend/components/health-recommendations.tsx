import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

export function HealthRecommendations() {
  const recommendations = [
    {
      type: "success",
      title: "Отличная норма сбережений",
      description: "Вы откладываете больше рекомендуемых 20% от дохода. Так держать!",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      type: "warning",
      title: "Подушка безопасности",
      description: "Рекомендуем увеличить до 3-х месячных расходов для полной безопасности.",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Рекомендации</h2>
        <span className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded">3</span>
      </div>

      <div className="space-y-3 mb-6">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon
          return (
            <div key={index} className={`p-4 rounded-lg ${rec.bgColor}`}>
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 ${rec.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="ghost" className="text-primary hover:text-primary/80 p-0">
        Подробнее о расчете
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  )
}
