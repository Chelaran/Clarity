"use client"

export function SpendingTypes() {
  const types = [
    { name: "Essential", percentage: 65, color: "bg-blue-500" },
    { name: "Lifestyle", percentage: 35, color: "bg-purple-500" },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-6">Тип трат</h3>

      <div className="space-y-6">
        {types.map((type) => (
          <div key={type.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{type.name}</span>
              <span className="text-sm font-semibold">{type.percentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${type.color} rounded-full transition-all`}
                style={{ width: `${type.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
