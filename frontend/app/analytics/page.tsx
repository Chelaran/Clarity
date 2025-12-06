"use client"

import { Header } from "@/components/header"
import { AnalyticsHeader } from "@/components/analytics-header"
import { AnalyticsStats } from "@/components/analytics-stats"
import { FinanceDynamics } from "@/components/finance-dynamics"
import { FinancialHealth } from "@/components/financial-health"
import { MLForecast } from "@/components/ml-forecast"
import { Anomalies } from "@/components/anomalies"
import { SpendingTypes } from "@/components/spending-types"
import { ExpenseChart } from "@/components/expense-chart"

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
              <ExpenseChart />
            </div>

            <div className="space-y-6">
              <FinancialHealth />
              <MLForecast />
              <Anomalies />
            </div>
          </div>

          <SpendingTypes />
        </div>
      </main>
    </div>
  )
}
