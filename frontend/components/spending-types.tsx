"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"

interface SummaryData {
  essential_expense: number
  non_essential_expense: number
  total_expense: number
}

export function SpendingTypes() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [data, setData] = useState<SummaryData | null>(null)
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

        const response = await fetch(`${apiUrl("/analytics/summary")}?month=${currentMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить данные")
        }

        const summary: SummaryData = await response.json()
        setData(summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки")
        console.error("SpendingTypes error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Тип трат</h3>
        <p className="text-sm text-muted-foreground">
          {error || "Нет данных"}
        </p>
      </Card>
    )
  }

  const totalExpense = data.total_expense || 1 // Избегаем деления на 0
  const essentialPercentage = totalExpense > 0 
    ? Math.round((data.essential_expense / totalExpense) * 100) 
    : 0
  const nonEssentialPercentage = 100 - essentialPercentage

  const types = [
    { 
      name: "Обязательные", 
      percentage: essentialPercentage, 
      color: "bg-blue-500",
      amount: data.essential_expense
    },
    { 
      name: "Необязательные", 
      percentage: nonEssentialPercentage, 
      color: "bg-purple-500",
      amount: data.non_essential_expense
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Тип трат</h3>

      {totalExpense === 0 ? (
        <p className="text-sm text-muted-foreground">Нет расходов в этом месяце</p>
      ) : (
        <div className="space-y-6">
          {types.map((type) => (
            <div key={type.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{type.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {Math.round(type.amount).toLocaleString("ru-RU")} ₽
                  </span>
                  <span className="text-sm font-semibold">{type.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${type.color} rounded-full transition-all`}
                  style={{ width: `${type.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
