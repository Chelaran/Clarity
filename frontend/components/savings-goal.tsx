"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useRefresh } from "@/components/refresh-context"

interface SavingsData {
  total_balance: number
  emergency_fund_months: number
  avg_monthly_expense: number
  recommendation: string
}

export function SavingsGoal() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { refreshIndex } = useRefresh()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null
        
        // Учитываем, что в переменной окружения может быть путь /api
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

        const response = await fetch(`${apiUrl}/health-score/savings-details`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Network response was not ok")
        }

        const result: SavingsData = await response.json()
        setData(result)
      } catch (err) {
        console.error("Failed to fetch savings details:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [refreshIndex])

  // --- МАТЕМАТИКА ---

  const current = data?.total_balance || 0
  const monthlyExpense = data?.avg_monthly_expense || 0
  
  // Цель = 6 месячных расходов. Если расход 0, цель 0.
  const goal = monthlyExpense * 6
  
  // Процент = (Баланс / Цель) * 100.
  // Если цель 0, ставим 0%, чтобы не делить на ноль.
  // Если цель достигнута с запасом (например 200%), percentage будет 200.
  const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0

  // Для отрисовки круга (strokeDasharray) нам нельзя превышать 100%, 
  // иначе линия начнет накладываться сама на себя некрасиво.
  const visualPercentage = Math.min(percentage, 100)

  // Длина окружности (2 * pi * r), где r=40
  const circumference = 251.2
  // Вычисляем длину закрашенной части
  const strokeDasharray = `${(visualPercentage / 100) * circumference} ${circumference}`

  // --- ОТРИСОВКА ---

  if (loading) {
    return (
      <Card className="p-6 h-[120px] flex items-center justify-center">
        <span className="text-muted-foreground animate-pulse">Загрузка...</span>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 h-[120px] flex items-center justify-center">
        <p className="text-red-500 text-sm">Ошибка загрузки</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        {/* ЛЕВАЯ ЧАСТЬ: ТЕКСТ */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            ФИН. ПОДУШКА ({data?.emergency_fund_months.toFixed(1)} мес.)
          </p>
          <p className="text-2xl font-bold text-foreground">
            {current.toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Цель (6 мес): {goal.toLocaleString('ru-RU')} ₽
          </p>
        </div>
        
        {/* ПРАВАЯ ЧАСТЬ: ДИАГРАММА (ВСЕГДА РИСУЕТСЯ) */}
        <div className="relative w-16 h-16 shrink-0 ml-4">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Серый фон круга */}
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="8" 
              className="text-muted" 
            />
            {/* Цветной индикатор */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Текст внутри круга (реальный процент, может быть > 100%) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{percentage}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}