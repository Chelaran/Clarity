"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, PieChart } from "lucide-react"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"

// Интерфейс элемента данных для графика
interface ExpenseItem {
  name: string
  originalKey: string // Ключ с бэка (например "Food")
  amount: number
  percentage: number
  color: string
}

// Интерфейс ответа API
interface ApiResponse {
  month: string
  total_expense: number
  distribution: Record<string, number> // {"Food": 25.5, ...}
}

// Словарь перевода категорий
const CATEGORY_NAMES: Record<string, string> = {
  Food: "Еда и продукты",
  Transport: "Транспорт",
  Shopping: "Шопинг",
  Rent: "Жилье",
  Housing: "Жилье",
  Health: "Здоровье",
  Education: "Образование",
  Entertainment: "Развлечения",
  Cafe: "Кафе и рестораны",
  Misc: "Разное",
  Other: "Другое",
  products: "Продукты", // На случай, если бэк вернет ключи из формы
  transport: "Транспорт",
  housing: "Жилье",
  subscriptions: "Подписки",
  health: "Здоровье",
  clothes: "Одежда",
  other: "Другое"
}

// Палитра цветов (будем брать по кругу)
const COLORS = [
  "#10B981", // Emerald (Зеленый)
  "#3B82F6", // Blue (Синий)
  "#F59E0B", // Amber (Оранжевый)
  "#8B5CF6", // Violet (Фиолетовый)
  "#EC4899", // Pink (Розовый)
  "#EF4444", // Red (Красный)
  "#6366F1", // Indigo
  "#14B8A6", // Teal
]

export function ExpenseChart() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh() // Подключаем автообновление

  const [chartData, setChartData] = useState<ExpenseItem[]>([])
  const [totalExpense, setTotalExpense] = useState(0)
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

        // Получаем текущий месяц YYYY-MM
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

        const response = await fetch(`${apiUrl("/analytics/category-distribution")}?month=${currentMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить структуру расходов")
        }

        const data: ApiResponse = await response.json()
        setTotalExpense(data.total_expense)

        // Преобразуем объект distribution {"Key": 10.5} в массив для графика
        const entries = Object.entries(data.distribution || {})
        
        // Сортируем от большего к меньшему
        entries.sort((a, b) => b[1] - a[1])

        const formattedData: ExpenseItem[] = entries.map(([key, percentage], index) => ({
          name: CATEGORY_NAMES[key] || key, // Переводим или оставляем как есть
          originalKey: key,
          percentage: percentage,
          // Считаем абсолютную сумму из процента
          amount: (data.total_expense * percentage) / 100,
          // Назначаем цвет циклически
          color: COLORS[index % COLORS.length]
        }))

        setChartData(formattedData)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки")
        console.error("Chart error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex]) // Обновляемся при изменении токена или добавлении операции

  // --- Рендер ---

  if (isLoading) {
    return (
      <Card className="p-6 h-[380px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 h-[380px] flex items-center justify-center">
        <p className="text-destructive text-sm">{error}</p>
      </Card>
    )
  }

  // Если расходов нет
  if (totalExpense === 0 || chartData.length === 0) {
    return (
      <Card className="p-6 h-[380px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <PieChart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Нет расходов</h3>
        <p className="text-sm text-muted-foreground mt-1">
          В этом месяце пока нет операций расхода.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Структура расходов</h2>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
        {/* График (Donut Chart) */}
        <div className="relative w-56 h-56 lg:w-64 lg:h-64 shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {chartData.map((expense, index) => {
              // Считаем сумму процентов ДО текущего элемента, чтобы повернуть сегмент
              const previousPercentage = chartData
                .slice(0, index)
                .reduce((sum, e) => sum + e.percentage, 0)
              
              const circumference = 2 * Math.PI * 70 // Длина окружности (r=70) ≈ 439.8
              // Длина сегмента
              const offset = circumference - (expense.percentage / 100) * circumference
              // Поворот сегмента
              const rotation = (previousPercentage / 100) * 360

              return (
                <circle
                  key={expense.originalKey}
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke={expense.color}
                  strokeWidth="40"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-500 ease-out"
                  style={{
                    transformOrigin: "100px 100px",
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              )
            })}
          </svg>
          
          {/* Текст в центре */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">Всего</p>
            <p className="text-2xl font-bold text-foreground">
              {/* Форматируем: 128 500 ₽ или 128k, если очень много */}
              {totalExpense > 999999 
                ? `${(totalExpense / 1000000).toFixed(1)}M` 
                : `${Math.round(totalExpense).toLocaleString("ru-RU")}`
              } ₽
            </p>
          </div>
        </div>

        {/* Легенда (Список справа или снизу) */}
        <div className="flex-1 w-full lg:max-w-none space-y-2.5 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          {chartData.map((expense) => (
            <div key={expense.originalKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: expense.color }} 
                />
                <span 
                  className="text-sm text-foreground truncate" 
                  title={expense.name}
                  style={{ maxWidth: '140px' }}
                >
                  {expense.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {Math.round(expense.amount).toLocaleString("ru-RU")} ₽
                </span>
                <span className="text-sm text-muted-foreground w-12 text-right whitespace-nowrap">
                  {expense.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}