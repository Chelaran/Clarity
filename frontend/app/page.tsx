"use client"

import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { TransactionHistory } from "@/components/transaction-history"
import { Forecast } from "@/components/forecast"
import { SavingsGoal } from "@/components/savings-goal"
import { TotalBalance } from "@/components/total-balance"
import { SmartAdvice } from "@/components/smart-advice"
import { QuickActions } from "@/components/quick-actions"
import { InvestmentsDepositsSummary } from "@/components/investments-deposits-summary"
import { AuthPage } from "@/components/auth-page"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  // Показываем форму авторизации для неавторизованных пользователей
  if (!isLoading && !user) {
    return <AuthPage />
  }

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Показываем основной контент для авторизованных
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-[1400px]">
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left column - 2 columns width */}
          <div className="lg:col-span-2 space-y-6">
            <InvestmentsDepositsSummary />
            <TransactionHistory />
            <Forecast />
          </div>

          {/* Right column - 1 column width */}
          <div className="space-y-6">
            <SavingsGoal />
            <TotalBalance />
            <SmartAdvice />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  )
}
