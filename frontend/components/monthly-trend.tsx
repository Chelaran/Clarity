"use client"

export function MonthlyTrend() {
  const months = [
    { name: "Май", income: 85, expense: 60 },
    { name: "Июн", income: 70, expense: 50 },
    { name: "Июл", income: 90, expense: 45 },
    { name: "Авг", income: 80, expense: 55 },
    { name: "Сен", income: 85, expense: 65 },
    { name: "Окт", income: 75, expense: 55 },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-6">Тренд по месяцам</h3>

      <div className="flex items-end justify-between gap-3 h-48">
        {months.map((month) => (
          <div key={month.name} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center gap-1">
              <div
                className="w-full bg-emerald-500 rounded-t-lg transition-all hover:opacity-80"
                style={{ height: `${month.income}%` }}
              />
              <div
                className="w-full bg-red-500 rounded-t-lg transition-all hover:opacity-80"
                style={{ height: `${month.expense}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{month.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
