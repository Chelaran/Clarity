"use client"

import { Card } from "@/components/ui/card"
import { Zap, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

interface OptimizationAdvice {
  category: string
  current_spend: number
  action: string
  recommendation: string
}

interface AnalyzeResponse {
  optimization_plan: OptimizationAdvice[]
}

// Маппинг категорий на русские названия
const categoryNames: Record<string, string> = {
  "Food": "Еда",
  "Transport": "Транспорт",
  "Shopping": "Покупки",
  "Rent": "Жилье",
  "Misc": "Прочее",
  "Другое": "Прочее"
}

export function SmartAdvice() {
  const [advices, setAdvices] = useState<OptimizationAdvice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdvices = async () => {
      try {
        const response = await apiFetch("/analyze", {
          method: "POST"
        })

        if (response.ok) {
          const data: AnalyzeResponse = await response.json()
          // Берем первые 2-3 рекомендации
          setAdvices(data.optimization_plan?.slice(0, 3) || [])
        }
      } catch (error) {
        console.error("Failed to fetch advices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdvices()
  }, [])

  if (loading) {
    return (
      <Card className="p-6 bg-[#1a1f2e] border-0">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-white">УМНЫЕ СОВЕТЫ</h2>
        </div>
        <p className="text-sm text-gray-400">Загрузка...</p>
      </Card>
    )
  }

  // Общие советы для новичков, когда нет персонализированных рекомендаций
  const beginnerAdvices = [
    {
      title: "Начните отслеживать все расходы",
      description: "Добавляйте каждую транзакцию, чтобы система могла анализировать ваши траты и давать персональные советы"
    },
    {
      title: "Создайте финансовую подушку",
      description: "Старайтесь накопить минимум 3-6 месяцев расходов на случай непредвиденных ситуаций"
    },
    {
      title: "Отмечайте обязательные расходы",
      description: "Помечайте важные траты (аренда, коммуналка, кредиты) как обязательные для более точного анализа"
    },
    {
      title: "Анализируйте категории расходов",
      description: "Обращайте внимание, на что уходит больше всего денег, и ищите возможности для оптимизации"
    }
  ]

  if (advices.length === 0) {
    return (
      <Card className="p-6 bg-[#1a1f2e] border-0">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-white">УМНЫЕ СОВЕТЫ</h2>
        </div>
        <div className="space-y-4">
          {beginnerAdvices.slice(0, 2).map((advice, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium mb-1">{advice.title}</p>
                <p className="text-xs text-gray-400">{advice.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-[#1a1f2e] border-0">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-white">УМНЫЕ СОВЕТЫ</h2>
      </div>

      <div className="space-y-4">
        {advices.map((advice, index) => {
          const categoryName = categoryNames[advice.category] || advice.category
          // Извлекаем процент роста из action, если есть
          const growthMatch = advice.action.match(/(\d+)%/)
          const growthPercent = growthMatch ? growthMatch[1] : null
          
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white font-medium mb-1">
                  {growthPercent 
                    ? `Траты на ${categoryName.toLowerCase()} выросли на ${growthPercent}%`
                    : advice.action || `Категория "${categoryName}": ${advice.current_spend.toLocaleString('ru-RU')}₽/мес`
                  }
                </p>
                <p className="text-xs text-gray-400">{advice.recommendation}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
