"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface Transaction {
  id: number
  user_id: number
  amount: number
  description: string
  ref_no: string
  category: string
  date: string
  type: "income" | "expense"
  is_essential: boolean
  created_at: string
}

interface Operation {
  id: string
  date: string
  time: string
  title: string
  category: string
  description: string
  amount: number
  card: string
  icon: string
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
const formatDate = (dateString: string): { date: string; time: string } => {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  let dateStr: string
  if (transactionDate.getTime() === today.getTime()) {
    dateStr = "Сегодня"
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    dateStr = "Вчера"
  } else {
    const months = [
      "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
      "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    ]
    dateStr = `${date.getDate()} ${months[date.getMonth()]}`
  }

  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })

  return { date: dateStr, time: timeStr }
}

// Преобразование транзакции в формат операции
const transactionToOperation = (tx: Transaction): Operation => {
  const { date, time } = formatDate(tx.date)
  const icon = categoryIcons[tx.category] || "📝"
  
  return {
    id: tx.id.toString(),
    date,
    time,
    title: tx.description || tx.category || "Без описания",
    category: tx.category || "Другое",
    description: tx.description || "",
    amount: tx.amount,
    card: tx.ref_no ? `REF • ${tx.ref_no}` : "CARD • 4291",
    icon,
  }
}

export function OperationsList() {
  const { token } = useAuth()
  const [operations, setOperations] = useState<Operation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  const fetchTransactions = async (reset = false) => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const currentOffset = reset ? 0 : offset
      const response = await fetch(
        `${apiUrl("/transactions")}?limit=${limit}&offset=${currentOffset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Не удалось загрузить транзакции")
      }

      const data: Transaction[] = await response.json()
      const newOperations = data.map(transactionToOperation)

      if (reset) {
        setOperations(newOperations)
        setOffset(limit)
      } else {
        setOperations((prev) => [...prev, ...newOperations])
        setOffset((prev) => prev + limit)
      }

      setHasMore(data.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка")
      console.error("Error fetching transactions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(true)
  }, [token])

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchTransactions(false)
    }
  }

  if (isLoading && operations.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && operations.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchTransactions(true)} variant="outline">
          Попробовать снова
        </Button>
      </div>
    )
  }

  if (operations.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <p className="text-muted-foreground">Нет транзакций</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {operations.map((operation) => (
          <div key={operation.id} className="p-6 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Date, Time, Icon */}
              <div className="flex items-center gap-4 min-w-[120px]">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{operation.date}</div>
                  <div className="text-xs text-muted-foreground">{operation.time}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {operation.icon}
                </div>
              </div>

              {/* Middle: Title, Category, Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{operation.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {operation.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{operation.description}</p>
              </div>

              {/* Right: Amount and Card */}
              <div className="text-right min-w-[140px]">
                <div
                  className={`text-lg font-semibold mb-0.5 ${
                    operation.amount > 0 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {operation.amount > 0 ? "+" : ""}
                  {operation.amount.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-xs text-muted-foreground">{operation.card}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="p-6 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Загрузить больше"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
