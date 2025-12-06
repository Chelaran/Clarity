import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export function Forecast() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <TrendingUp className="w-5 h-5 text-success mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Прогноз на следующий месяц</h2>
          <p className="text-sm text-muted-foreground">
            При текущем темпе трат вы сможете отложить <span className="font-semibold text-foreground">12 500 ₽</span>{" "}
            больше обычного
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>ЭКОНОМИЯ</span>
          <span>КОМФОРТ</span>
          <span>ЛИМИТ</span>
        </div>

        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-success to-success/70 rounded-full" />
        </div>

        <div className="flex justify-end">
          <div className="bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-medium">
            Ожидаемый остаток: ~5%
          </div>
        </div>
      </div>
    </Card>
  )
}
