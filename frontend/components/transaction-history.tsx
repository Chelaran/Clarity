"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface Transaction {
  id: number
  amount: number
  description: string
  category: string
  date: string
  type: "income" | "expense"
}

// Маппинг категорий на иконки
const categoryIcons: Record<string, string> = {
  Food: "🛒",
  Transport: "🚗",
  Shopping: "🛍️",
  Rent: "🏠",
  Health: "💊",
  Education: "📚",
  Entertainment: "🎬",
  Salary: "💰",
  Misc: "📝",
  Другое: "📝",
}

// Функция для форматирования даты
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (transactionDate.getTime() === today.getTime()) {
    return "Сегодня"
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return "Вчера"
  } else {
    const months = [
      "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
      "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    ]
    return `${date.getDate()} ${months[date.getMonth()]}`
  }
}

export function TransactionHistory() {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${apiUrl("/transactions")}?limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить транзакции")
        }

        const data: Transaction[] = await response.json()
        setTransactions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching transactions:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [token])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

  if (transactions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">История операций</h2>
        </div>
        <p className="text-muted-foreground text-sm">Нет транзакций</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">История операций</h2>
        <Button variant="link" className="text-primary text-sm p-0 h-auto" asChild>
          <a href="/operations">Показать все</a>
        </Button>
      </div>

      <div className="space-y-1">
        {transactions.map((transaction) => {
          const icon = categoryIcons[transaction.category] || "📝"
          const dateStr = formatDate(transaction.date)
          const name = transaction.description || transaction.category || "Без описания"
          const category = transaction.category || "Другое"

          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">{dateStr}</p>
                <p
                  className={`text-sm font-semibold ${
                    transaction.amount > 0 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="ghost" className="w-full mt-4 text-muted-foreground" asChild>
        <a href="/operations">Загрузить больше</a>
      </Button>
    </Card>
  )
}
