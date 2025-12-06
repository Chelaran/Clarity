"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Loader2, Sparkles } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"

interface PredictData {
  predicted_expense_next_month: number
  model_used: string
  current_monthly_expense: number
  current_monthly_income: number
}

export function Forecast() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [data, setData] = useState<PredictData | null>(null)
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

        const response = await fetch(apiUrl("/predict"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось построить прогноз")
        }

        const result: PredictData = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка прогноза")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  if (isLoading) {
    return (
      <Card className="p-6 h-[180px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (error || !data || data.current_monthly_income === 0) {
    return (
      <Card className="p-6 h-[180px] flex flex-col items-center justify-center text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground mb-2" />
        <h3 className="text-sm font-medium">Прогноз недоступен</h3>
        <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
          Недостаточно данных о доходах для расчета.
        </p>
      </Card>
    )
  }

  // --- Расчеты ---
  const income = data.current_monthly_income
  const predictedExpense = data.predicted_expense_next_month
  const currentExpense = data.current_monthly_expense
  const estimatedSavings = income - predictedExpense
  
  // Процент расходов от дохода
  const expenseRatio = Math.min(Math.max((predictedExpense / income) * 100, 0), 100)
  const savingsPercent = 100 - expenseRatio
  const isSpendingLess = predictedExpense < currentExpense

  let barColorClass = "bg-primary"
  if (expenseRatio > 90) barColorClass = "bg-red-500"
  else if (expenseRatio > 60) barColorClass = "bg-amber-500"
  else barColorClass = "bg-emerald-500"

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        {isSpendingLess ? (
          <TrendingDown className="w-5 h-5 text-emerald-500 mt-0.5" />
        ) : (
          <TrendingUp className="w-5 h-5 text-amber-500 mt-0.5" />
        )}
        
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Прогноз на следующий месяц
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {estimatedSavings > 0 ? (
              <>
                ИИ ожидает расходы <span className="font-medium text-foreground">{Math.round(predictedExpense).toLocaleString()} ₽</span>. 
                Вы сможете отложить примерно <span className="font-semibold text-emerald-600">{Math.round(estimatedSavings).toLocaleString()} ₽</span>.
              </>
            ) : (
              <>
                Внимание: прогнозируемые расходы ({Math.round(predictedExpense).toLocaleString()} ₽) могут превысить доход.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-8 relative"> {/* Добавил relative и mt-8 чтобы текст влез */}
        
        {/* Процент над полоской */}
        <div 
          className="absolute -top-5 text-xs font-bold text-foreground transition-all duration-1000"
          style={{ 
            left: `${expenseRatio}%`, 
            transform: 'translateX(-50%)' // Центрируем цифру относительно конца полоски
          }}
        >
          {Math.round(expenseRatio)}%
        </div>

        {/* Прогресс бар */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${barColorClass}`}
            style={{ width: `${expenseRatio}%` }} 
          />
        </div>

        {/* Бейдж с результатом внизу */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
             Нагрузка на бюджет
          </span>
          <div className="bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-medium">
             Остаток: ~{savingsPercent.toFixed(0)}%
          </div>
        </div>
      </div>
    </Card>
  )
}