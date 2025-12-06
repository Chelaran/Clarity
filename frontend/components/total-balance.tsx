"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Wallet, Loader2 } from "lucide-react" // Loader2 уже был, просто объединил импорт
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context" // 1. Импортируем контекст

interface SummaryData {
  total_balance: number
}

export function TotalBalance() {
  const { token } = useAuth()
  
  // 2. Достаем сигнал обновления
  const { refreshIndex } = useRefresh()

  const [totalBalance, setTotalBalance] = useState<number | null>(null)
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

        // Получаем данные за текущий месяц (там есть total_balance)
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

        const data: SummaryData = await response.json()
        setTotalBalance(data.total_balance)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching total balance:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
  // 3. Добавляем refreshIndex в зависимости, чтобы перезагружать данные при сигнале
  }, [token, refreshIndex])

  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString("ru-RU")
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-destructive text-sm">{error}</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ОБЩИЙ БАЛАНС</p>
          <p className="text-2xl font-bold text-foreground">
            {totalBalance !== null ? formatNumber(totalBalance) : "0"} ₽
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Сумма всех транзакций</p>
    </Card>
  )
}