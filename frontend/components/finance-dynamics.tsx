"use client"

export function FinanceDynamics() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
      {/* 
         ХЕДЕР:
         flex-col: элементы друг под другом на мобилке
         md:flex-row: в строку на десктопе
      */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-lg font-semibold">Динамика финансов</h3>
        
        {/* 
           Обертка для Легенды и Кнопок:
           w-full: на мобилке занимает всю ширину
           flex-row: элементы в строку
           justify-between: разнесены по краям (легенда слева, кнопки справа)
           md:w-auto: на десктопе занимает только нужное место
           md:gap-6: отступ между группами на десктопе
        */}
        <div className="flex flex-row items-center justify-between w-full md:w-auto md:gap-6">
          
          {/* Легенда (Доходы/Расходы) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Доходы</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Расходы</span>
            </div>
          </div>

          {/* Кнопки (График/Таблица) */}
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md bg-background shadow-sm text-primary text-xs sm:text-sm font-medium transition-all">
              График
            </button>
          </div>
        </div>
      </div>

      {/* 
         ГРАФИК:
         overflow-x-auto: добавляет горизонтальный скролл, если график не влезает
      */}
      <div className="relative h-[250px] sm:h-[300px] w-full overflow-x-auto">
        {/* 
           min-w-[600px]: запрещает графику сжиматься слишком сильно, 
           чтобы текст дат и сумм оставался читаемым. 
           На телефоне появится скролл, но график не сломается.
        */}
        <svg viewBox="0 0 700 300" className="w-full h-full min-w-[600px]">
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="50"
              y1={50 + i * 60}
              x2="680"
              y2={50 + i * 60}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          <path
            d="M 50 150 Q 120 100 150 120 T 250 80 T 350 100 T 450 130 T 550 150 T 650 180"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M 50 200 Q 120 210 150 190 T 250 200 T 350 195 T 450 210 T 550 220 T 650 240"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {["1 Окт", "5 Окт", "10 Окт", "15 Окт", "20 Окт", "25 Окт", "30 Окт"].map((label, i) => (
            <text key={label} x={50 + i * 100} y="290" fill="#9ca3af" fontSize="12" textAnchor="middle">
              {label}
            </text>
          ))}

          {["0k", "25k", "50k", "75k", "100k"].map((label, i) => (
            <text key={label} x="30" y={260 - i * 60} fill="#9ca3af" fontSize="12" textAnchor="end">
              {label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}