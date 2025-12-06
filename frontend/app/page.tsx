import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { ExpenseChart } from "@/components/expense-chart"
import { TransactionHistory } from "@/components/transaction-history"
import { Forecast } from "@/components/forecast"
import { SavingsGoal } from "@/components/savings-goal"
import { SmartAdvice } from "@/components/smart-advice"
import { QuickActions } from "@/components/quick-actions"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-[1400px]">
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left column - 2 columns width */}
          <div className="lg:col-span-2 space-y-6">
            <ExpenseChart />
            <TransactionHistory />
            <Forecast />
          </div>

          {/* Right column - 1 column width */}
          <div className="space-y-6">
            <SavingsGoal />
            <SmartAdvice />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  )
}
