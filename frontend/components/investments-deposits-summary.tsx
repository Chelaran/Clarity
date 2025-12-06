"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"
import { Loader2, TrendingUp, TrendingDown, Building2, Wallet, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface Investment {
  id: number
  amount: number
  current_value: number
}

interface Deposit {
  id: number
  amount: number
  interest_rate: number
  term_months: number
  close_date: string | null
}

export function InvestmentsDepositsSummary() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [investments, setInvestments] = useState<Investment[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const headers = {
          Authorization: `Bearer ${token}`,
        }

        const [investmentsRes, depositsRes] = await Promise.all([
          fetch(`${apiUrl("/investments")}?limit=100`, { headers }),
          fetch(`${apiUrl("/deposits")}?limit=100&active_only=true`, { headers }),
        ])

        if (!investmentsRes.ok || !depositsRes.ok) {
          throw new Error("Не удалось загрузить данные")
        }

        const investmentsData = await investmentsRes.json()
        const depositsData = await depositsRes.json()

        setInvestments(investmentsData)
        setDeposits(depositsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching investments/deposits:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  // Расчет данных по инвестициям
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0)
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0)
  const investmentProfit = totalCurrentValue - totalInvestments
  const investmentProfitPercent = totalInvestments > 0 ? (investmentProfit / totalInvestments) * 100 : 0

  // Расчет данных по вкладам
  const activeDeposits = deposits.filter((d) => !d.close_date)
  const totalDeposits = activeDeposits.reduce((sum, dep) => sum + dep.amount, 0)
  const totalInterest = activeDeposits.reduce((sum, dep) => {
    if (dep.interest_rate > 0 && dep.term_months > 0) {
      const years = dep.term_months / 12.0
      return sum + dep.amount * (dep.interest_rate / 100.0) * years
    }
    return sum
  }, 0)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-destructive text-sm">{error}</p>
      </Card>
    )
  }

  // Если нет ни вкладов, ни инвестиций, не показываем компонент
  if (totalInvestments === 0 && totalDeposits === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Инвестиции и вклады</h3>
          <Link href="/investments-deposits">
            <Button variant="ghost" size="sm">
              Управлять
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Инвестиции */}
          {totalInvestments > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-muted-foreground">Инвестиции</span>
                </div>
                {investmentProfit !== 0 && (
                  <div className="flex items-center gap-1">
                    {investmentProfit >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        investmentProfit >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {investmentProfit >= 0 ? "+" : ""}
                      {investmentProfitPercent.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {totalCurrentValue.toLocaleString("ru-RU")} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  Вложено: {totalInvestments.toLocaleString("ru-RU")} ₽
                </p>
                {investmentProfit !== 0 && (
                  <p
                    className={`text-xs font-medium ${
                      investmentProfit >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {investmentProfit >= 0 ? "+" : ""}
                    {investmentProfit.toLocaleString("ru-RU")} ₽
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Вклады */}
          {totalDeposits > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-muted-foreground">Вклады</span>
                </div>
                {totalInterest > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{totalInterest.toLocaleString("ru-RU")} ₽
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {totalDeposits.toLocaleString("ru-RU")} ₽
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeDeposits.length} {activeDeposits.length === 1 ? "вклад" : activeDeposits.length < 5 ? "вклада" : "вкладов"}
                </p>
                {totalInterest > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Ожидаемый доход: {totalInterest.toLocaleString("ru-RU")} ₽
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

