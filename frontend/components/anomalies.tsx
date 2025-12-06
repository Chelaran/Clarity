"use client"

import { AlertTriangle } from "lucide-react"

export function Anomalies() {
  const anomalies = [
    {
      title: 'Ресторан "Luxury Place"',
      subtitle: "22 Окт • Развлечения",
      amount: "-12500 ₽",
      tag: "Выше обычного",
    },
    {
      title: "Подписка Service X",
      subtitle: "20 Окт • Подписки",
      amount: "-2990 ₽",
      tag: "Выше обычного",
    },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Аномалии</h3>
        </div>
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

      <div className="space-y-4">
        {anomalies.map((anomaly, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{anomaly.title}</p>
                <p className="text-xs text-muted-foreground">{anomaly.subtitle}</p>
              </div>
              <p className="text-sm font-semibold text-red-600">{anomaly.amount}</p>
            </div>
            <span className="inline-block text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{anomaly.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
