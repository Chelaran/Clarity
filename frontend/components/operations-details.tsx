"use client"

import { Search, Filter, Download } from "lucide-react"

export function OperationsDetails() {
  const operations = [
    {
      date: "24 Окт, 14:30",
      category: "Еда",
      description: "ВкусВилл",
      source: "Apple Pay",
      amount: "-2450 ₽",
      categoryColor: "text-blue-600 bg-blue-50",
    },
    {
      date: "23 Окт, 18:15",
      category: "Транспорт",
      description: "Uber",
      source: "Card *4455",
      amount: "-450 ₽",
      categoryColor: "text-amber-600 bg-amber-50",
    },
    {
      date: "23 Окт, 12:00",
      category: "Зарплата",
      description: "Tech Corp LLC",
      source: "Transfer",
      amount: "+125000 ₽",
      categoryColor: "text-emerald-600 bg-emerald-50",
    },
    {
      date: "22 Окт, 20:40",
      category: "Развлечения",
      description: "Кинотеатр",
      source: "Apple Pay",
      amount: "-1200 ₽",
      categoryColor: "text-purple-600 bg-purple-50",
    },
    {
      date: "22 Окт, 09:15",
      category: "Здоровье",
      description: "Аптека",
      source: "Card *4455",
      amount: "-850 ₽",
      categoryColor: "text-pink-600 bg-pink-50",
    },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Детализация операций</h3>

        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">ДАТА</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">КАТЕГОРИЯ</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">ОПИСАНИЕ</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">ИСТОЧНИК</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3">СУММА</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op, index) => (
              <tr key={index} className="border-b border-border/50 last:border-0">
                <td className="py-4 text-sm text-muted-foreground">{op.date}</td>
                <td className="py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${op.categoryColor}`}>{op.category}</span>
                </td>
                <td className="py-4 text-sm">{op.description}</td>
                <td className="py-4 text-sm text-muted-foreground">{op.source}</td>
                <td
                  className={`py-4 text-sm font-semibold text-right ${op.amount.startsWith("+") ? "text-emerald-600" : "text-foreground"}`}
                >
                  {op.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
