"use client"

import { Header } from "@/components/header"
import { AnalyticsHeader } from "@/components/analytics-header"
import { AnalyticsStats } from "@/components/analytics-stats"
import { FinanceDynamics } from "@/components/finance-dynamics"
import { FinancialHealth } from "@/components/financial-health"
import { MLForecast } from "@/components/ml-forecast"
import { MonthlyTrend } from "@/components/monthly-trend"
import { Anomalies } from "@/components/anomalies"
import { OperationsDetails } from "@/components/operations-details"
import { AIAdvice } from "@/components/ai-advice"
import { SpendingTypes } from "@/components/spending-types"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        <AnalyticsHeader />

        <div className="mt-6 space-y-6">
          <AnalyticsStats />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <FinanceDynamics />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Структура расходов</h3>
                    <button className="text-muted-foreground hover:text-foreground">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 200 200" className="transform -rotate-90">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="20"
                          strokeDasharray="226 502"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="20"
                          strokeDasharray="161 502"
                          strokeDashoffset="-226"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="20"
                          strokeDasharray="75 502"
                          strokeDashoffset="-387"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="20"
                          strokeDasharray="60 502"
                          strokeDashoffset="-462"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground">ВСЕГО</p>
                        <p className="text-2xl font-bold">128k</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Жильё", value: "45k", color: "bg-emerald-500" },
                      { name: "Еда", value: "32k", color: "bg-blue-500" },
                      { name: "Транспорт", value: "15k", color: "bg-amber-500" },
                      { name: "Развлечения", value: "12k", color: "bg-purple-500" },
                      { name: "Шопинг", value: "9k", color: "bg-pink-500" },
                      { name: "Здоровье", value: "9k", color: "bg-rose-400" },
                      { name: "Другое", value: "6k", color: "bg-gray-400" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <MonthlyTrend />
              </div>
            </div>

            <div className="space-y-6">
              <FinancialHealth />
              <MLForecast />
              <Anomalies />
            </div>
          </div>

          <OperationsDetails />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIAdvice />
            </div>
            <SpendingTypes />
          </div>
        </div>
      </main>
    </div>
  )
}
