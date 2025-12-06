import { Card } from "@/components/ui/card"
import { Zap, ArrowRight } from "lucide-react"

export function SmartAdvice() {
  return (
    <Card className="p-6 bg-[#1a1f2e] border-0">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-white">УМНЫЕ СОВЕТЫ</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium mb-1">Траты на такси выросли на 15%</p>
            <p className="text-xs text-gray-400">Попробуйте кошелёк, общественный транспорт</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium mb-1">Кэшбэк 1500 ₽ доступен</p>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              Зачислить на счет
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
