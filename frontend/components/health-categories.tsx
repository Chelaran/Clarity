"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Wallet, CreditCard, PiggyBank, TrendingUp, Building2, Loader2, Info, Target, PieChart, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// --- ТИПЫ ---
interface CategoryItem {
  id: number
  title: string
  amount: number
  badge?: string
  status: string
  icon: any
  color: string
  iconColor: string
  rawData?: any 
}

// --- КОМПОНЕНТЫ ВИЗУАЛИЗАЦИИ (Графики) ---
const DonutChart = ({ data }: { data: { name: string, percent: number, color: string }[] }) => {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  let accumulatedPercent = 0

  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-muted-foreground">Нет данных</div>

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          {data.map((item, index) => {
            const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`
            const rotation = accumulatedPercent * 3.6
            accumulatedPercent += item.percent
            return (
              <circle key={index} cx="90" cy="90" r={radius} fill="none" stroke={item.color} strokeWidth="20"
                strokeDasharray={strokeDasharray} style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "90px 90px" }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <PieChart className="w-8 h-8 text-muted-foreground/50" />
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {data.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate max-w-[120px]">{item.name === 'Food' ? 'Продукты' : item.name}</span>
            </div>
            <span className="font-medium">{item.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const GaugeChart = ({ value, max }: { value: number, max: number }) => {
  const percentage = Math.min(value / max, 1)
  const radius = 80
  const circumference = Math.PI * radius
  const strokeDasharray = `${percentage * circumference} ${circumference}`

  return (
    <div className="relative w-48 h-28 flex justify-center overflow-hidden">
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="20" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f97316" strokeWidth="20" strokeLinecap="round"
          strokeDasharray={strokeDasharray} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl font-bold">{value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">МЕСЯЦЕВ</span>
      </div>
    </div>
  )
}

// --- МОДАЛЬНОЕ ОКНО ---
function CategoryModal({ isOpen, onClose, category }: { isOpen: boolean; onClose: () => void; category: CategoryItem | null }) {
  const { token } = useAuth()
  const [expenseChart, setExpenseChart] = useState<any[]>([])
  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    if (isOpen && category?.id === 2 && token) {
      setLoadingChart(true)
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      
      fetch(`${apiUrl("/analytics/category-distribution")}?month=${currentMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const dist = data.distribution || {}
        const formatted = Object.entries(dist).map(([key, val]: [string, any], index) => ({
          name: key,
          percent: val,
          color: `hsl(${index * 50 + 200}, 80%, 50%)`
        })).sort((a, b) => b.percent - a.percent)
        setExpenseChart(formatted)
      })
      .finally(() => setLoadingChart(false))
    }
  }, [isOpen, category, token])

  if (!category) return null
  const { rawData } = category

  const renderContent = () => {
    switch (category.id) {
      case 1: // ДОХОДЫ
        return (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <div className="text-sm text-blue-600 mb-1">Всего заработано</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(rawData.total_income).toLocaleString()} ₽
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                <div className="text-sm text-emerald-600 mb-1">Отложено</div>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {Math.round(rawData.savings_amount).toLocaleString()} ₽
                </div>
              </div>
            </div>
            <div className="p-6 border rounded-2xl bg-card">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" /> Норма сбережений: {rawData.savings_rate.toFixed(1)}%
              </h4>
              <div className="h-6 w-full bg-muted rounded-full overflow-hidden flex relative">
                <div 
                  className="h-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white" 
                  style={{ width: `${Math.min(Math.max(rawData.savings_rate, 0), 100)}%` }}
                >
                  {rawData.savings_rate > 5 && `${rawData.savings_rate.toFixed(0)}%`}
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-black/20 left-[20%]" title="Цель 20%" />
              </div>
            </div>
          </div>
        )

      case 2: // РАСХОДЫ
        return (
          <div className="grid gap-6">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Всего</div>
                <div className="font-bold">{Math.round(rawData.total_expense).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-xs text-red-600">Обязательные</div>
                <div className="font-bold text-red-900 dark:text-red-100">{Math.round(rawData.essential_expense || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs text-purple-600">Хотелки</div>
                <div className="font-bold text-purple-900 dark:text-purple-100">{Math.round(rawData.non_essential_expense || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="border rounded-2xl p-6 flex flex-col items-center">
              <h4 className="font-medium mb-4 w-full text-left">Распределение трат</h4>
              {loadingChart ? <Loader2 className="animate-spin" /> : <DonutChart data={expenseChart} />}
            </div>
          </div>
        )

      case 3: // НАКОПЛЕНИЯ
        return (
          <div className="grid gap-6">
            <div className="flex flex-col items-center p-6 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
              <h4 className="text-orange-800 dark:text-orange-200 font-medium mb-4">Финансовая подушка</h4>
              <GaugeChart value={rawData.emergency_fund_months || 0} max={6} />
              <p className="text-sm text-center mt-4 text-orange-700 dark:text-orange-300">
                У вас есть запас на <strong>{(rawData.emergency_fund_months || 0).toFixed(1)} мес.</strong>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 border rounded-xl">
                 <div className="text-xs text-muted-foreground mb-1">Баланс</div>
                 <div className="text-xl font-bold">{Math.round(rawData.total_balance || 0).toLocaleString()} ₽</div>
               </div>
               <div className="p-4 border rounded-xl">
                 <div className="text-xs text-muted-foreground mb-1">Цель</div>
                 <div className="text-xl font-bold">{Math.round(rawData.target_amount || 0).toLocaleString()} ₽</div>
               </div>
            </div>
          </div>
        )

      case 4: // ИНВЕСТИЦИИ
        const profit = rawData.profit || 0
        const isProfitable = profit >= 0
        return (
          <div className="grid gap-6">
            <div className={`p-6 rounded-2xl border flex items-center justify-between ${isProfitable ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
               <div>
                 <div className="text-sm opacity-80">Общая прибыль</div>
                 <div className={`text-3xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                   {isProfitable ? '+' : ''}{Math.round(profit).toLocaleString()} ₽
                 </div>
               </div>
               <div className={`px-3 py-1 rounded-full text-sm font-bold ${isProfitable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                 {isProfitable ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingUp className="w-4 h-4 inline mr-1 rotate-180" />}
                 {rawData.profit_percent}%
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Вложено средств</span>
                  <span className="font-mono font-medium">{Math.round(rawData.total_amount || 0).toLocaleString()} ₽</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Текущая оценка</span>
                  <span className="font-mono font-medium">{Math.round(rawData.total_current_value || 0).toLocaleString()} ₽</span>
               </div>
            </div>
          </div>
        )

      case 5: // ВКЛАДЫ
        return (
          <div className="grid gap-6">
             <div className="p-6 bg-blue-600 text-white rounded-2xl shadow-lg">
                <div className="flex items-start justify-between">
                   <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Ожидаемый доход</p>
                      <h3 className="text-3xl font-bold">+{Math.round(rawData.total_interest || 0).toLocaleString()} ₽</h3>
                   </div>
                   <Building2 className="w-10 h-10 text-blue-200 opacity-50" />
                </div>
                <div className="mt-6 pt-4 border-t border-blue-500/50 flex gap-6">
                   <div>
                      <span className="text-xs text-blue-200 block">Тело вкладов</span>
                      <span className="font-mono font-medium">{Math.round(rawData.total_amount || 0).toLocaleString()} ₽</span>
                   </div>
                </div>
             </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-background p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="p-6 border-b border-border bg-muted/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center shadow-sm`}>
                <category.icon className={`w-6 h-6 ${category.iconColor}`} />
              </div>
              <div>
                {category.title}
                <DialogDescription className="text-sm mt-1 font-normal">
                  Детальный анализ и статистика
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="p-6 sm:p-8 space-y-8">
          {renderContent()}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-5 flex gap-4 items-start">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full shrink-0">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">Рекомендация AI</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                {category.status}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
          <Button onClick={onClose}>Понятно</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


// --- ОСНОВНОЙ КОМПОНЕНТ ---

export function HealthCategories() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatMoney = (val: number) => {
    const num = Number(val) || 0
    return Math.round(Math.abs(num)).toLocaleString("ru-RU") + " ₽"
  }

  const extractAmount = (text: string): number => {
    if (!text) return 0
    const match = text.match(/([-+]?\d+\.\d+)/) || text.match(/(\d+)/)
    if (match) return Math.abs(parseFloat(match[0]))
    return 0
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const headers = { Authorization: `Bearer ${token}` }
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

        const [summaryRes, incomeRes, expenseRes, savingsRes, investRes, depositsRes] = await Promise.all([
          fetch(`${apiUrl("/analytics/summary")}?month=${currentMonth}`, { headers }),
          fetch(apiUrl("/health-score/income-details"), { headers }),
          fetch(apiUrl("/health-score/expense-details"), { headers }),
          fetch(apiUrl("/health-score/savings-details"), { headers }),
          fetch(apiUrl("/health-score/investment-details"), { headers }),
          fetch(apiUrl("/health-score/deposit-details"), { headers }),
        ])

        const summary = summaryRes.ok ? await summaryRes.json() : {}
        const income = incomeRes.ok ? await incomeRes.json() : {}
        const expense = expenseRes.ok ? await expenseRes.json() : {}
        const savings = savingsRes.ok ? await savingsRes.json() : {}
        const invest = investRes.ok ? await investRes.json() : {}
        const deposits = depositsRes.ok ? await depositsRes.json() : {}

        // --- ПРАВКА ДЛЯ ДОХОДОВ/РАСХОДОВ ---
        const realIncome = summary.total_income || extractAmount(income.recommendation)
        const realExpense = summary.total_expense || extractAmount(expense.recommendation)
        
        const realSavings = income.savings_amount || (realIncome - Math.abs(realExpense))
        const realSavingsRate = income.savings_rate || (realIncome > 0 ? (realSavings / realIncome) * 100 : 0)

        const incomeRawData = { ...income, total_income: realIncome, savings_amount: realSavings, savings_rate: realSavingsRate }
        const expenseRawData = { ...expense, total_expense: realExpense }

        // --- ПРАВКА ДЛЯ ИНВЕСТИЦИЙ ---
        // Если API вернул 0 в полях, но есть текст "5000 р", пробуем достать
        const realInvestCurrent = invest.total_current_value || extractAmount(invest.recommendation)
        // Если "Вложено" 0, но "Текущая" > 0 (например, ошибка API), считаем что вложено == текущая, чтобы не пугать юзера
        const realInvestAmount = invest.total_amount || (realInvestCurrent > 0 ? realInvestCurrent : 0)
        const realInvestProfit = invest.profit || (realInvestCurrent - realInvestAmount)
        
        // Исправляем объект invest
        const investRawData = {
            ...invest,
            total_current_value: realInvestCurrent,
            total_amount: realInvestAmount,
            profit: realInvestProfit,
            profit_percent: invest.profit_percent || 0
        }

        const mappedData: CategoryItem[] = [
          {
            id: 1,
            title: "Доходы",
            amount: realIncome,
            status: income.recommendation,
            icon: Wallet,
            color: "bg-primary",
            iconColor: "text-primary-foreground",
            rawData: incomeRawData
          },
          {
            id: 2,
            title: "Расходы",
            amount: realExpense,
            status: expense.recommendation,
            icon: CreditCard,
            color: "bg-blue-500",
            iconColor: "text-white",
            rawData: expenseRawData
          },
          {
            id: 3,
            title: "Накопления",
            amount: savings.total_balance || 0,
            badge: savings.emergency_fund_months ? `${savings.emergency_fund_months.toFixed(1)} мес` : undefined,
            status: savings.recommendation,
            icon: PiggyBank,
            color: "bg-orange-500",
            iconColor: "text-white",
            rawData: savings
          },
          {
            id: 4,
            title: "Инвестиции",
            amount: realInvestCurrent,
            badge: investRawData.profit_percent ? `+${investRawData.profit_percent}%` : undefined,
            status: invest.recommendation,
            icon: TrendingUp,
            color: "bg-purple-500",
            iconColor: "text-white",
            rawData: investRawData // Передаем исправленные данные
          },
          {
            id: 5,
            title: "Вклады",
            amount: deposits.total_amount || 0,
            badge: deposits.total_interest ? `+${deposits.total_interest}₽` : undefined,
            status: deposits.recommendation,
            icon: Building2,
            color: "bg-blue-600",
            iconColor: "text-white",
            rawData: deposits
          },
        ]

        setCategories(mappedData)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, refreshIndex])

  const handleCardClick = (category: CategoryItem) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Card 
              key={category.id} 
              className="p-6 transition-all hover:shadow-md cursor-pointer hover:border-primary/50 group"
              onClick={() => handleCardClick(category)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-6 h-6 ${category.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                      {category.title}
                    </span>
                    {category.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted rounded whitespace-nowrap">
                        {category.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground tracking-tight">
                    {formatMoney(category.amount)}
                  </div>
                </div>

                <div className="hidden sm:block text-right max-w-[40%] pl-4">
                  <p className="text-xs text-muted-foreground truncate leading-relaxed" title={category.status}>
                    {category.status}
                  </p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="sm:hidden mt-3 pt-3 border-t border-border">
                 <p className="text-xs text-muted-foreground text-center truncate">
                    {category.status}
                 </p>
              </div>
            </Card>
          )
        })}
      </div>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        category={selectedCategory} 
      />
    </>
  )
}