"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Minus, Loader2, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"

interface HealthData {
  score: number
  grade: string
  trend: {
    direction: string 
  }
  insights: any[]
}

export function FinancialHealth() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [data, setData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

        const response = await fetch(`${apiUrl("/health-score")}?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Ошибка загрузки")

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

  // --- RENDER ---

  const score = data?.score || 0
  const grade = data?.grade || "-"
  const insightsCount = data?.insights?.length || 0

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  let colorClass = "text-emerald-600"
  let bgClass = "bg-emerald-100"
  let strokeColor = "#10b981"
  let gradientClass = "from-emerald-50 to-blue-50"

  if (score < 50) {
    colorClass = "text-red-600"
    bgClass = "bg-red-100"
    strokeColor = "#ef4444"
    gradientClass = "from-red-50 to-orange-50"
  } else if (score < 80) {
    colorClass = "text-amber-600"
    bgClass = "bg-amber-100"
    strokeColor = "#f59e0b"
    gradientClass = "from-amber-50 to-yellow-50"
  }

  const trendDirection = data?.trend?.direction
  let TrendIcon = Minus
  let trendText = "Стабильно"
  
  if (trendDirection === "improving") {
    TrendIcon = TrendingUp
    trendText = "Улучшается"
  } else if (trendDirection === "declining") {
    TrendIcon = TrendingDown
    trendText = "Ухудшается"
  }

  if (isLoading) {
    return (
      // Убрали h-full, вернули фиксированную высоту только для лоадера или авто-высоту
      <div className="rounded-2xl border border-border p-6 flex items-center justify-center bg-muted/10 min-h-[360px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    // Убрали h-full, оставили только padding и стили
    <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl border border-border p-6 transition-colors duration-500`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/financial-health" className="group flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <h3 className="text-lg font-semibold text-foreground">Финансовое Здоровье</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${colorClass} ${bgClass}`}>
          Grade {grade}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-6">Комплексная оценка состояния</p>

      {/* DIAGRAM */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="transform -rotate-90 w-full h-full">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-black/5 dark:text-white/10" />
            <circle
              cx="60" cy="60" r={radius} fill="none" stroke={strokeColor} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${colorClass}`}>{Math.round(score)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <TrendIcon className={`w-5 h-5 ${colorClass}`} />
          <span className="text-muted-foreground font-medium">{trendText}</span>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {insightsCount > 0 ? `${insightsCount} рекомендации доступны` : "Нет рекомендаций"}
            </span>
          </div>
          <div className="h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: strokeColor }} />
          </div>
        </div>
      </div>
    </div>
  )
}