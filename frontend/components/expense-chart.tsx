"use client"

import { Card } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

const expenses = [
  { name: "Жилье", amount: 45000, percentage: 35, color: "#10B981" },
  { name: "Еда", amount: 32000, percentage: 25, color: "#3B82F6" },
  { name: "Транспорт", amount: 15000, percentage: 12, color: "#F59E0B" },
  { name: "Развлечения", amount: 12000, percentage: 9, color: "#8B5CF6" },
  { name: "Шопинг", amount: 8500, percentage: 7, color: "#EC4899" },
]

export function ExpenseChart() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Структура расходов</h2>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Donut Chart */}
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {expenses.map((expense, index) => {
              const previousPercentage = expenses.slice(0, index).reduce((sum, e) => sum + e.percentage, 0)
              const circumference = 2 * Math.PI * 70
              const offset = circumference - (expense.percentage / 100) * circumference
              const rotation = (previousPercentage / 100) * 360

              return (
                <circle
                  key={expense.name}
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke={expense.color}
                  strokeWidth="40"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transformOrigin: "100px 100px",
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">Всего</p>
            <p className="text-2xl font-bold text-foreground">128k</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 w-full">
          {expenses.map((expense) => (
            <div key={expense.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: expense.color }} />
                <span className="text-sm text-foreground">{expense.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">{expense.amount.toLocaleString()} ₽</span>
                <span className="text-sm text-muted-foreground w-10 text-right">{expense.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
