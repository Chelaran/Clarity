"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"

interface HealthData {
  score: number
  grade: string
  trend: {
    direction: string // "improving" | "declining" | "stable"
  }
}

export function HealthScore() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh() // Чтобы обновлялось при добавлении операций

  const [data, setData] = useState<HealthData | null>(null)
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

        const json = await response.json()
        setData(json)
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
      <Card className="p-8 h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  // Значения по умолчанию, если данных нет
  const score = data?.score || 0
  
  // --- Логика круговой диаграммы ---
  const radius = 85
  const circumference = 2 * Math.PI * radius // ~534
  // Длина заполненной части
  const offset = circumference - (score / 100) * circumference

  // --- Определение цвета в зависимости от оценки ---
  let colorClass = "text-primary" // По дефолту
  let strokeColor = "hsl(var(--primary))"
  
  if (score >= 80) {
    colorClass = "text-emerald-500"
    strokeColor = "#10b981" // emerald-500
  } else if (score >= 50) {
    colorClass = "text-amber-500"
    strokeColor = "#f59e0b" // amber-500
  } else if (score > 0) {
    colorClass = "text-red-500"
    strokeColor = "#ef4444" // red-500
  }

  // --- Логика тренда ---
  const trendDirection = data?.trend?.direction || "stable"
  let TrendIcon = Minus
  let trendText = "Стабильно"
  let trendColor = "text-muted-foreground"

  if (trendDirection === "improving") {
    TrendIcon = TrendingUp
    trendText = "Тренд: улучшается"
    trendColor = "text-emerald-500"
  } else if (trendDirection === "declining") {
    TrendIcon = TrendingDown
    trendText = "Тренд: ухудшается"
    trendColor = "text-red-500"
  }

  return (
    <Card className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
      {/* Circular Progress */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Фон круга (серый) */}
          <circle 
            cx="100" 
            cy="100" 
            r={radius} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="16" 
            className="text-muted/30"
          />
          
          {/* Прогресс бар (цветной) */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Текст внутри */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${colorClass}`}>
            {Math.round(score)}
          </span>
          <span className="text-sm text-muted-foreground font-medium uppercase mt-1">
            из 100
          </span>
        </div>
      </div>

      {/* Trend */}
      <div className={`flex items-center gap-2 ${trendColor}`}>
        <TrendIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{trendText}</span>
      </div>
      
      {/* Grade Badge (опционально, если API возвращает grade: A, B, C...) */}
      {data?.grade && (
        <div className="mt-4 px-3 py-1 rounded-full bg-muted text-xs font-bold text-muted-foreground border border-border">
          Класс: {data.grade}
        </div>
      )}
    </Card>
  )
}