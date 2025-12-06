"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context" // 1. Импортируем контекст

interface SummaryData {
  month: string
  total_income: number
  total_expense: number
  balance: number
  total_balance: number
  savings_rate: number
  essential_expense: number
  non_essential_expense: number
  by_category: Record<string, number>
}

export function StatsCards() {
  const { token } = useAuth()
  
  // 2. Получаем сигнал обновления
  const { refreshIndex } = useRefresh()

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [prevSummary, setPrevSummary] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Получаем текущий месяц
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

        // Получаем предыдущий месяц
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`

        // Загружаем данные за текущий месяц
        const currentResponse = await fetch(`${apiUrl("/analytics/summary")}?month=${currentMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!currentResponse.ok) {
          throw new Error("Не удалось загрузить данные")
        }

        const currentData: SummaryData = await currentResponse.json()
        setSummary(currentData)

        // Загружаем данные за предыдущий месяц для сравнения
        const prevResponse = await fetch(`${apiUrl("/analytics/summary")}?month=${prevMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (prevResponse.ok) {
          const prevData: SummaryData = await prevResponse.json()
          setPrevSummary(prevData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching summary:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
  // 3. Добавляем refreshIndex в зависимости. 
  // Теперь при добавлении операции данные перезапросятся автоматически.
  }, [token, refreshIndex])

  // Функция для расчет процента изменения
  const calculateChange = (current: number, previous: number | null): { value: number; isPositive: boolean } => {
    if (!previous || previous === 0) {
      return { value: 0, isPositive: true }
    }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    }
  }

  // Форматирование числа
  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString("ru-RU")
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 border-0">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-0 col-span-3">
          <p className="text-destructive text-center">{error || "Нет данных"}</p>
        </Card>
      </div>
    )
  }

  const incomeChange = calculateChange(summary.total_income, prevSummary?.total_income)
  const expenseChange = calculateChange(summary.total_expense, prevSummary?.total_expense)
  const balance = summary.balance // Баланс за месяц
  const availableToSpend = Math.max(0, balance * 0.3) // 30% от остатка можно потратить

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Income Card */}
      <Card className="p-6 bg-[#E8F5F0] border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Доходы</p>
            <p className="text-3xl font-bold text-foreground mb-1">{formatNumber(summary.total_income)} ₽</p>
            {prevSummary && (
              <div className={`flex items-center gap-1 ${incomeChange.isPositive ? "text-success" : "text-destructive"}`}>
                {incomeChange.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {incomeChange.isPositive ? "+" : "-"}
                  {incomeChange.value.toFixed(0)}%
                </span>
              </div>
            )}
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
            <p className="text-3xl font-bold text-foreground mb-1">{formatNumber(Math.abs(summary.total_expense))} ₽</p>
            {prevSummary && (
              <div className={`flex items-center gap-1 ${expenseChange.isPositive ? "text-destructive" : "text-success"}`}>
                {expenseChange.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {expenseChange.isPositive ? "+" : "-"}
                  {expenseChange.value.toFixed(0)}%
                </span>
              </div>
            )}
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
            <p className="text-3xl font-bold text-foreground mb-1">{formatNumber(balance)} ₽</p>
            <p className="text-sm text-muted-foreground">
              Можно потратить {formatNumber(availableToSpend)} ₽
            </p>
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