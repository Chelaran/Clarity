"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, ArrowRight, Info, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"
import Link from "next/link"

interface Insight {
  type: "achievement" | "warning" | "info"
  message: string
  impact?: number
}

// Маппинг стилей для разных типов рекомендаций
const STYLE_MAP = {
  achievement: {
    title: "Отличная работа",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  warning: {
    title: "Обратите внимание",
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  info: {
    title: "Совет",
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  }
}

export function HealthRecommendations() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const response = await fetch(apiUrl("/health-score"), {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to fetch")

        const data = await response.json()
        
        // Берем insights из ответа. Если их нет, ставим пустой массив.
        setInsights(data.insights || [])
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  if (isLoading) {
    return (
      <Card className="p-6 h-full flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  // Если рекомендаций нет совсем
  if (insights.length === 0) {
    return (
      <Card className="p-6 h-full flex flex-col items-center justify-center text-center min-h-[300px]">
        <CheckCircle2 className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
        <h3 className="font-semibold">Нет новых рекомендаций</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ваши финансы в порядке. Продолжайте в том же духе!
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Рекомендации</h2>
        {insights.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded">
            {insights.length}
          </span>
        )}
      </div>

      {/* Список рекомендаций */}
      <div className="space-y-3 mb-6 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
        {insights.map((rec, index) => {
          // Определяем стиль по типу, если тип неизвестен - используем info
          const style = STYLE_MAP[rec.type] || STYLE_MAP.info
          const Icon = style.icon

          return (
            <div key={index} className={`p-4 rounded-lg ${style.bgColor} transition-all`}>
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 ${style.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1 text-sm">
                    {style.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rec.message}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto pt-2">
        <Button asChild variant="ghost" className="text-primary p-0 h-auto font-medium">
          <Link href="/ai-assistant" className="flex items-center">
            Спросить совета у AI
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}