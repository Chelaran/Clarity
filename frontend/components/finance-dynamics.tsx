"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"
import { Loader2 } from "lucide-react"

interface TrendData {
  month: string // "2025-07"
  income: number
  expense: number
  balance: number
}

interface AnalyticsTrendsResponse {
  months: TrendData[]
}

export function FinanceDynamics() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [data, setData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // --- 1. ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        // Запрашиваем данные за полгода (6 месяцев), чтобы график был красивым
        const response = await fetch(`${apiUrl("/analytics/trends")}?months=6`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Ошибка загрузки трендов")

        const json: AnalyticsTrendsResponse = await response.json()
        // API может вернуть данные в разном порядке, лучше отсортировать по дате
        const sorted = (json.months || []).sort((a, b) => a.month.localeCompare(b.month))
        setData(sorted)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  // --- 2. МАТЕМАТИКА ГРАФИКА ---
  const { pointsIncome, pointsExpense, xLabels, yLabels } = useMemo(() => {
    if (data.length === 0) return { pointsIncome: "", pointsExpense: "", xLabels: [], yLabels: [] }

    // Размеры области рисования внутри SVG
    const width = 600 // Ширина рабочей области
    const height = 240 // Высота рабочей области (y от 50 до 290)
    const startX = 50
    const startY = 290 // Нижняя точка (ноль)

    // 1. Находим максимальное значение, чтобы построить масштаб
    const maxVal = Math.max(
      ...data.map(d => d.income),
      ...data.map(d => d.expense),
      1000 // Минимальный потолок, чтобы не делить на 0, если всё по нулям
    )
    // Добавляем 10% сверху, чтобы график не упирался в потолок
    const ceiling = maxVal * 1.1

    // 2. Генерируем подписи оси Y (5 уровней)
    const yLabels = [0, 0.25, 0.5, 0.75, 1].map(percent => {
      const val = ceiling * percent
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}m`
      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
      return val.toFixed(0)
    })

    // 3. Генерируем координаты точек
    const stepX = width / (data.length - 1 || 1) // Шаг по горизонтали

    const getCoords = (val: number, index: number) => {
      const x = startX + index * stepX
      // Инвертируем Y, так как в SVG 0 сверху
      const y = startY - (val / ceiling) * height
      return `${x},${y}`
    }

    const pointsIncome = data.map((d, i) => getCoords(d.income, i)).join(" ")
    const pointsExpense = data.map((d, i) => getCoords(d.expense, i)).join(" ")

    // 4. Генерируем подписи оси X (Месяцы)
    const xLabels = data.map((d, i) => {
      const date = new Date(d.month + "-01") // "2025-07-01"
      const label = date.toLocaleDateString("ru-RU", { month: "short" }) // "июл."
      // Убираем точку в конце, если есть, и делаем первую букву заглавной
      return {
        x: startX + i * stepX,
        label: label.replace('.', '').charAt(0).toUpperCase() + label.slice(1).replace('.', '')
      }
    })

    return { pointsIncome, pointsExpense, xLabels, yLabels }
  }, [data])


  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
      {/* ХЕДЕР */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-lg font-semibold">Динамика финансов</h3>
        
        <div className="flex flex-row items-center justify-between w-full md:w-auto md:gap-6">
          {/* Легенда */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Доходы</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Расходы</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md bg-background shadow-sm text-primary text-xs sm:text-sm font-medium transition-all">
              График
            </button>
          </div>
        </div>
      </div>

      {/* ГРАФИК SVG */}
      <div className="relative h-[250px] sm:h-[300px] w-full overflow-x-auto custom-scrollbar">
        <svg viewBox="0 0 700 300" className="w-full h-full min-w-[600px]">
          <defs>
            {/* Градиент для красоты под линией (можно включить, если использовать area chart) */}
          </defs>

          {/* Сетка (Горизонтальные линии) - 5 штук */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="50"
              y1={50 + i * 60} // 290 (низ) - 50 (верх) = 240 высота. Шаг 60.
              x2="680"
              y2={50 + i * 60}
              stroke="currentColor"
              className="text-border"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          ))}

          {/* Линия Доходов (Зеленая) */}
          <polyline
            points={pointsIncome}
            fill="none"
            stroke="#10b981" // emerald-500
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm transition-all duration-1000 ease-out"
          />

          {/* Линия Расходов (Красная) */}
          <polyline
            points={pointsExpense}
            fill="none"
            stroke="#ef4444" // red-500
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm transition-all duration-1000 ease-out"
          />

          {/* Подписи оси X (Месяцы) */}
          {xLabels.map((item) => (
            <text 
              key={item.label} 
              x={item.x} 
              y="290" 
              className="fill-muted-foreground text-[12px]"
              fontSize="12" 
              textAnchor="middle"
            >
              {item.label}
            </text>
          ))}

          {/* Подписи оси Y (Суммы) */}
          {yLabels.map((label, i) => (
            <text 
              key={i} 
              x="40" 
              // 290 - это ноль, идем вверх шагами по 60
              y={290 - i * 60 + 4} // +4 для центрирования по вертикали относительно линии
              className="fill-muted-foreground text-[12px]"
              fontSize="12" 
              textAnchor="end"
            >
              {label}
            </text>
          ))}
        </svg>
        
        {/* Если данных нет */}
        {data.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
             <p className="text-sm text-muted-foreground">Недостаточно данных для графика</p>
           </div>
        )}
      </div>
    </div>
  )
}