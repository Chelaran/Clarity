"use client"
import Link from "next/link" // 1. Не забудьте импортировать Link

export function FinancialHealth() {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link 
          href="/financial-health" 
          className="group flex items-center gap-2 cursor-pointer"
        >
          <h3 className="text-lg font-semibold">Финансовое Здоровье</h3>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          </Link>
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Grade B</span>
      </div>

      <p className="text-xs text-muted-foreground mb-6">Комплексная оценка состояния</p>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="transform -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray="314"
              strokeDashoffset="85"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-emerald-600">73</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-muted-foreground">Улучшается</span>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">3 рекомендации доступны</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "73%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
