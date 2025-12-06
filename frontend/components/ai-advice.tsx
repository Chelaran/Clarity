"use client"

import { Sparkles } from "lucide-react"

export function AIAdvice() {
  const advice = [
    {
      type: "НОВИНКА!",
      title: "Оптимизация подписок",
      description: "Вы тратите 4500₽ на сервисы, которыми редко пользуетесь",
      amount: "+1500 ₽",
      typeColor: "text-emerald-600 bg-emerald-500/20",
    },
    {
      type: "ЛИМИТ НА ТАКСИ!",
      title: "Лимит на такси",
      description: "Расходы на транспорт выросли на 25%",
      amount: "+3000 ₽",
      typeColor: "text-amber-600 bg-amber-500/20",
    },
  ]

  return (
    <div className="bg-[#1a1f2e] rounded-2xl border border-border p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Советы</h3>
        </div>
        <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">AI Generated</span>
      </div>

      <div className="space-y-4">
        {advice.map((item, index) => (
          <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${item.typeColor}`}>{item.type}</span>
              <span className="text-emerald-400 font-semibold">{item.amount}</span>
            </div>
            <h4 className="font-semibold mb-1">{item.title}</h4>
            <p className="text-sm text-white/60">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
