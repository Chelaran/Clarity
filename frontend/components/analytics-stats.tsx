"use client"

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react"

export function AnalyticsStats() {
  const stats = [
    {
      icon: TrendingDown,
      label: "ОБЩИЙ ДОХОД",
      value: "245 000 ₽",
      trend: "+12%",
      isPositive: true,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: TrendingUp,
      label: "ОБЩИЙ РАСХОД",
      value: "128 400 ₽",
      trend: "-5%",
      isPositive: false,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      icon: Wallet,
      label: "BALANCE",
      value: "116 600 ₽",
      trend: "+28%",
      isPositive: true,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: PiggyBank,
      label: "SAVINGS RATE",
      value: "47%",
      trend: "+5.2%",
      isPositive: true,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className={`text-sm font-medium ${stat.isPositive ? "text-emerald-600" : "text-red-600"}`}>
                {stat.trend}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}
