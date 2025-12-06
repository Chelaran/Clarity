"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Calendar, Tag, FileText, Hash, CreditCard } from "lucide-react"
import { useRefresh } from "@/components/refresh-context"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Transaction {
  id: number
  amount: number
  description: string
  category: string
  date: string
  type: "income" | "expense"
  ref_no?: string
  is_essential?: boolean
  created_at?: string
  user_id?: number
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
  
  // 2. Получаем сигнал обновления
  const { refreshIndex } = useRefresh()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

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
        
        // 3. Сортируем: Новые (с большим ID или датой) должны быть сверху
        // Если данные приходят в порядке [Старая -> Новая], мы их разворачиваем.
        // Надежнее сортировать по ID или дате, чтобы точно новые были сверху.
        const sortedData = data.sort((a, b) => b.id - a.id) 
        
        setTransactions(sortedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching transactions:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  // 4. Добавляем refreshIndex в зависимости
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
              className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
              onClick={() => setSelectedTransaction(transaction)}
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

      {/* Модальное окно с деталями транзакции */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedTransaction.type === "income" ? "Доход" : "Расход"}
                </DialogTitle>
                <DialogDescription>
                  Детальная информация о транзакции
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Основная информация */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-3xl">
                      {categoryIcons[selectedTransaction.category] || "📝"}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedTransaction.description || selectedTransaction.category || "Без описания"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTransaction.category || "Другое"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${selectedTransaction.type === "income" ? "text-primary" : "text-foreground"}`}>
                      {selectedTransaction.type === "income" ? "+" : "-"}
                      {Math.abs(selectedTransaction.amount).toLocaleString("ru-RU")} ₽
                    </div>
                    <Badge 
                      variant={selectedTransaction.type === "income" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {selectedTransaction.type === "income" ? "Доход" : "Расход"}
                    </Badge>
                  </div>
                </div>

                {/* Детали */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Дата транзакции</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(selectedTransaction.date), "dd MMMM yyyy", { locale: ru })}
                    </p>
                  </div>

                  {selectedTransaction.created_at && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Время создания</span>
                      </div>
                      <p className="font-medium">
                        {format(new Date(selectedTransaction.created_at), "dd MMMM yyyy, HH:mm", { locale: ru })}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      <span>Категория</span>
                    </div>
                    <p className="font-medium">{selectedTransaction.category || "Не указана"}</p>
                  </div>

                  {selectedTransaction.is_essential !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="w-4 h-4" />
                        <span>Тип траты</span>
                      </div>
                      <p className="font-medium">
                        {selectedTransaction.is_essential ? "Обязательное" : "Необязательное"}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.ref_no && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="w-4 h-4" />
                        <span>Референсный номер</span>
                      </div>
                      <p className="font-medium font-mono text-sm">{selectedTransaction.ref_no}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="w-4 h-4" />
                      <span>ID транзакции</span>
                    </div>
                    <p className="font-medium font-mono text-sm">#{selectedTransaction.id}</p>
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <FileText className="w-4 h-4" />
                      <span>Описание</span>
                    </div>
                    <p className="text-foreground">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}