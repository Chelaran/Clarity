import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Income Card */}
      <Card className="p-6 bg-[#E8F5F0] border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Доходы</p>
            <p className="text-3xl font-bold text-foreground mb-1">245 000 ₽</p>
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <div className="w-16 h-12">
            <svg viewBox="0 0 60 40" className="w-full h-full">
              <polyline
                points="0,30 10,25 20,28 30,20 40,15 50,12 60,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-success"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Expense Card */}
      <Card className="p-6 bg-[#FFF4E6] border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Расходы</p>
            <p className="text-3xl font-bold text-foreground mb-1">128 400 ₽</p>
            <div className="flex items-center gap-1 text-orange-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">-5%</span>
            </div>
          </div>
          <div className="w-16 h-12">
            <svg viewBox="0 0 60 40" className="w-full h-full">
              <polyline
                points="0,10 10,15 20,12 30,18 40,22 50,25 60,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-orange-600"
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* Balance Card */}
      <Card className="p-6 bg-[#E6F2FF] border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Остаток</p>
            <p className="text-3xl font-bold text-foreground mb-1">116 600 ₽</p>
            <p className="text-sm text-muted-foreground">Можно потратить 45 000 ₽</p>
          </div>
          <div className="w-16 h-12">
            <svg viewBox="0 0 60 40" className="w-full h-full">
              <polyline
                points="0,20 10,22 20,18 30,20 40,19 50,21 60,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-info"
              />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  )
}
