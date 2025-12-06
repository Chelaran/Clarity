import { Card } from "@/components/ui/card"

export function SavingsGoal() {
  const current = 105000
  const goal = 180000
  const percentage = Math.round((current / goal) * 100)

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">ФИН. ПОДУШКА</p>
          <p className="text-2xl font-bold text-foreground">{current.toLocaleString()} ₽</p>
          <p className="text-sm text-muted-foreground mt-1">Цель: {goal.toLocaleString()} ₽</p>
        </div>
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
              className="text-primary"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{percentage}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
