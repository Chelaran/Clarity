"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"

// Интерфейс ответа от API summary
interface SummaryData {
  month: string
  total_income: number
  total_expense: number
  balance: number
  savings_rate: number
}

export function AnalyticsStats() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh() // Подключаем автообновление

  const [currentData, setCurrentData] = useState<SummaryData | null>(null)
  const [prevData, setPrevData] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Хелпер для форматирования денег
  const formatMoney = (amount: number) => {
    return Math.round(amount).toLocaleString("ru-RU") + " ₽"
  }

  // Хелпер для расчета тренда в %
  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { value: "+100%", isPositive: true }
    
    const diff = current - previous
    const percentage = (diff / Math.abs(previous)) * 100
    const sign = percentage > 0 ? "+" : ""
    
    return {
      value: `${sign}${percentage.toFixed(1)}%`,
      isPositive: percentage >= 0
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(false)

        // 1. Вычисляем даты
        const now = new Date()
        const currentMonthStr = now.toISOString().slice(0, 7) // "2023-10"
        
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonthStr = prevDate.toISOString().slice(0, 7) // "2023-09"

        // 2. Делаем два запроса параллельно
        const [currRes, prevRes] = await Promise.all([
          fetch(`${apiUrl("/analytics/summary")}?month=${currentMonthStr}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiUrl("/analytics/summary")}?month=${prevMonthStr}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (!currRes.ok) throw new Error("Ошибка загрузки данных")

        const currJson: SummaryData = await currRes.json()
        setCurrentData(currJson)

        // Предыдущий месяц может не существовать (если новый юзер), это не критично
        if (prevRes.ok) {
          const prevJson: SummaryData = await prevRes.json()
          setPrevData(prevJson)
        } else {
          setPrevData(null)
        }

      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 h-[140px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !currentData) {
    return <div className="text-muted-foreground text-sm">Не удалось загрузить статистику</div>
  }

  // --- Подготовка данных для отображения ---
  
  // 1. Доход
  const incomeTrend = calculateTrend(currentData.total_income, prevData?.total_income || 0)
  
  // 2. Расход (Тут логика инвертирована: если расход вырос - это "плохо" (красный), упал - "хорошо" (зеленый))
  const expenseTrendRaw = calculateTrend(currentData.total_expense, prevData?.total_expense || 0)
  // isPositive для расхода: true если расход УПАЛ (значение с минусом)
  const isExpenseGood = !expenseTrendRaw.isPositive // Если рост (+), то это плохо (false)

  // 3. Баланс
  const balanceTrend = calculateTrend(currentData.balance, prevData?.balance || 0)

  // 4. Savings Rate
  const savingsTrend = calculateTrend(currentData.savings_rate, prevData?.savings_rate || 0)

  const stats = [
    {
      label: "ОБЩИЙ ДОХОД",
      value: formatMoney(currentData.total_income),
      trend: incomeTrend.value,
      isPositive: incomeTrend.isPositive, // Рост дохода = хорошо
      icon: TrendingUp, // Логичнее для дохода стрелку вверх
      iconBg: "bg-emerald-50 dark:bg-emerald-950",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600" // Цвет тренда
    },
    {
      label: "ОБЩИЙ РАСХОД",
      value: formatMoney(currentData.total_expense),
      trend: expenseTrendRaw.value,
      isPositive: isExpenseGood, // Рост расхода = плохо
      icon: TrendingDown, 
      iconBg: "bg-red-50 dark:bg-red-950",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: isExpenseGood ? "text-emerald-600" : "text-red-600"
    },
    {
      label: "БАЛАНС",
      value: formatMoney(currentData.balance),
      trend: balanceTrend.value,
      isPositive: balanceTrend.isPositive,
      icon: Wallet,
      iconBg: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: balanceTrend.isPositive ? "text-emerald-600" : "text-red-600"
    },
    {
      label: "SAVINGS RATE",
      value: `${currentData.savings_rate.toFixed(1)}%`,
      trend: savingsTrend.value,
      isPositive: savingsTrend.isPositive,
      icon: PiggyBank,
      iconBg: "bg-cyan-50 dark:bg-cyan-950",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      valueColor: savingsTrend.isPositive ? "text-emerald-600" : "text-red-600"
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className={`text-sm font-medium ${stat.valueColor}`}>
                {stat.trend}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}