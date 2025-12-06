"use client"

export function MLForecast() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="text-lg font-semibold">ML Прогноз</h3>
      </div>

      <p className="text-xs text-muted-foreground mb-4">Следующие 3 месяца</p>

      <div className="flex items-center justify-end mb-2">
        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">Следующие</span>
      </div>

      <div className="relative h-32">
        <svg viewBox="0 0 300 120" className="w-full h-full">
          <defs>
            <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M 20 80 L 80 60 L 140 50 L 200 55 L 260 65"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5 5"
          />

          <path d="M 20 80 L 80 60 L 140 50 L 200 55 L 260 65 L 260 120 L 20 120 Z" fill="url(#forecastGradient)" />

          {[80, 140, 200, 260].map((x) => (
            <circle key={x} cx={x} cy={x === 80 ? 60 : x === 140 ? 50 : x === 200 ? 55 : 65} r="4" fill="#8b5cf6" />
          ))}

          {["Ноя", "Дек", "Янв"].map((label, i) => (
            <text key={label} x={80 + i * 90} y="110" fill="#9ca3af" fontSize="11" textAnchor="middle">
              {label}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Прогноз расходов</span>
          <span className="font-semibold">~135k ₽</span>
        </div>
      </div>
    </div>
  )
}
