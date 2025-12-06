"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Calendar, Tag, FileText, Hash, CreditCard } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useRefresh } from "@/components/refresh-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// --- ИНТЕРФЕЙСЫ ---
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
  // Добавляем ссылку на оригинальную транзакцию для деталей
  transaction?: Transaction
}

// --- ХЕЛПЕРЫ ---
const categoryIcons: Record<string, string> = {
  Food: "🛒",
  Transport: "🚗",
  Shopping: "🛍️",
  Rent: "🏠",
  Housing: "🏠",
  Health: "💊",
  Education: "📚",
  Entertainment: "🎬",
  Salary: "💰",
  Misc: "📝",
  products: "🛒",
  transport: "🚗",
  housing: "🏠",
  other: "📝",
}

const formatDateTime = (targetDateString: string, createdAtString?: string): { date: string; time: string } => {
  const dateObj = new Date(targetDateString)
  const now = new Date()
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const [y, m, d] = targetDateString.split('T')[0].split('-').map(Number)
  const transactionDate = new Date(y, m - 1, d)

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
    dateStr = `${transactionDate.getDate()} ${months[transactionDate.getMonth()]}`
  }

  const timeObj = createdAtString ? new Date(createdAtString) : new Date()
  const timeStr = timeObj.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })

  return { date: dateStr, time: timeStr }
}

const transactionToOperation = (tx: Transaction): Operation => {
  const { date, time } = formatDateTime(tx.date, tx.created_at)
  const icon = categoryIcons[tx.category] || categoryIcons[tx.category.toLowerCase()] || "📝"
  
  return {
    id: tx.id.toString(),
    date,
    time,
    title: tx.description || tx.category || "Без описания",
    category: tx.category || "Другое",
    description: tx.description || "",
    amount: tx.amount,
    card: tx.ref_no ? `REF • ${tx.ref_no.slice(-4)}` : "CARD • 4291",
    icon,
    transaction: tx, // Сохраняем оригинальную транзакцию
  }
}

// --- КОМПОНЕНТ ---

interface OperationsListProps {
  activeFilter: string
  searchQuery: string
  dateRange: DateRange | undefined
}

export function OperationsList({ activeFilter, searchQuery, dateRange }: OperationsListProps) {
  const { token } = useAuth()
  
  // 2. Получаем сигнал обновления
  const { refreshIndex } = useRefresh()

  const [operations, setOperations] = useState<Operation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const limit = 20

  const fetchTransactions = useCallback(async (reset = false) => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      if (reset) {
        setIsLoading(true)
        setError(null)
      }

      const currentOffset = reset ? 0 : offset
      
      let url = `${apiUrl("/transactions")}?limit=${limit}&offset=${currentOffset}`
      
      if (activeFilter === "expense") url += "&type=expense"
      else if (activeFilter === "income") url += "&type=income"

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }

      if (dateRange?.from) {
        url += `&start_date=${format(dateRange.from, "yyyy-MM-dd")}`
      }
      if (dateRange?.to) {
        url += `&end_date=${format(dateRange.to, "yyyy-MM-dd")}`
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Не удалось загрузить транзакции")
      }

      const data: Transaction[] = await response.json()

      // Клиентская фильтрация
      let filteredData = data

      if (activeFilter === "expense") {
        filteredData = filteredData.filter(t => t.type === "expense" || t.amount < 0)
      } else if (activeFilter === "income") {
        filteredData = filteredData.filter(t => t.type === "income" || t.amount > 0)
      }

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase()
        filteredData = filteredData.filter(t => 
          (t.category && t.category.toLowerCase().includes(lowerQuery)) ||
          (t.description && t.description.toLowerCase().includes(lowerQuery))
        )
      }

      const newOperations = filteredData.map(transactionToOperation)

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
    } finally {
      setIsLoading(false)
    }
  }, [token, activeFilter, offset, searchQuery, dateRange]) 

  // Эффект обновления
  useEffect(() => {
    const timer = setTimeout(() => {
      setOperations([])
      setOffset(0)
      fetchTransactions(true) 
    }, 300)

    return () => clearTimeout(timer)
    
    // 3. ДОБАВИЛИ refreshIndex СЮДА
    // Теперь при изменении refreshIndex (сигнал от модалки) сработает этот эффект
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, searchQuery, dateRange, token, refreshIndex]) 

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
        <p className="text-muted-foreground">Транзакций не найдено</p>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20, y: 10 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <motion.div
      className="bg-card rounded-xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="divide-y divide-border"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {operations.map((operation, index) => (
            <motion.div
              key={operation.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                if (operation.transaction) {
                  setSelectedTransaction(operation.transaction)
                }
              }}
            >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-[120px]">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{operation.date}</div>
                  <div className="text-xs text-muted-foreground">{operation.time}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {operation.icon}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{operation.title}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {operation.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{operation.description}</p>
              </div>

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
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

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
                      {categoryIcons[selectedTransaction.category] || categoryIcons[selectedTransaction.category.toLowerCase()] || "📝"}
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

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Время создания</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(selectedTransaction.created_at), "dd MMMM yyyy, HH:mm", { locale: ru })}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      <span>Категория</span>
                    </div>
                    <p className="font-medium">{selectedTransaction.category || "Не указана"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      <span>Тип траты</span>
                    </div>
                    <p className="font-medium">
                      {selectedTransaction.is_essential ? "Обязательное" : "Необязательное"}
                    </p>
                  </div>

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
    </motion.div>
  )
}