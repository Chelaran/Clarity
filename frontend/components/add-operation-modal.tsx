"use client"

import { useState } from "react"
import { Calendar, QrCode, Check, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context" 

interface AddOperationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categories = [
  { id: "products", name: "Продукты", icon: "🛒" },
  { id: "transport", name: "Транспорт", icon: "🚗" },
  { id: "housing", name: "Жилье", icon: "🏠" },
  { id: "subscriptions", name: "Подписки", icon: "📄" },
  { id: "health", name: "Здоровье", icon: "💊" },
  { id: "clothes", name: "Одежда", icon: "👕" },
  { id: "other", name: "Другое", icon: "📝" },
]

const getCurrentDate = () => {
  const today = new Date()
  return today.toLocaleDateString("ru-RU")
}

export function AddOperationModal({ open, onOpenChange }: AddOperationModalProps) {
  const { token } = useAuth()
  const { triggerRefresh } = useRefresh() // <--- Хук для обновления данных
  
  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [date, setDate] = useState(getCurrentDate())
  const [isEssential, setIsEssential] = useState(false)
  const [description, setDescription] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!token) {
      setError("Вы не авторизованы")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [day, month, year] = date.split(".")
      const formattedDate = `${year}-${month}-${day}`
      
      const numericAmount = parseFloat(amount)
      const finalAmount = type === "expense" ? -Math.abs(numericAmount) : Math.abs(numericAmount)

      const refNo = `TXN-${Date.now()}`

      const categoryName = categories.find(c => c.id === selectedCategory)?.name || ""
      const finalDescription = description.trim() || categoryName

      const payload = {
        amount: finalAmount,
        description: finalDescription,
        ref_no: refNo,
        date: formattedDate,
        type: type,
        is_essential: isEssential
      }

      const response = await fetch(apiUrl("/transactions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error("Не удалось сохранить операцию")
      }

      // Успех
      triggerRefresh() // <--- Обновляем данные на главной странице
      
      onOpenChange(false)
      resetForm()
      
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при сохранении")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setAmount("")
    setSelectedCategory(null)
    setDescription("")
    setIsEssential(false)
    setDate(getCurrentDate())
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-[425px] max-h-[95vh] overflow-y-auto p-4 sm:p-6 gap-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">Добавить операцию</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Заполните данные о транзакции
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {/* Тип операции */}
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-8 text-sm rounded-md transition-all", 
                type === "expense" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-transparent"
              )}
              onClick={() => setType("expense")}
            >
              Расход
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-8 text-sm rounded-md transition-all", 
                type === "income" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-transparent"
              )}
              onClick={() => setType("income")}
            >
              Доход
            </Button>
          </div>

          {/* Сумма */}
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₽</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-7 h-10 text-lg font-bold"
              />
            </div>
          </div>

          {/* Категории */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Категория</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-all aspect-square sm:aspect-auto sm:h-16",
                    selectedCategory === category.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <span className="text-xl leading-none">{category.icon}</span>
                  <span className="text-[10px] font-medium truncate w-full text-center">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Дата и чекбокс */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input 
                type="text" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="pl-8 h-9 text-sm" 
                placeholder="ДД.ММ.ГГГГ"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="isEssential"
                checked={isEssential} 
                onCheckedChange={(checked) => setIsEssential(checked as boolean)} 
              />
              <label htmlFor="isEssential" className="text-xs sm:text-sm cursor-pointer select-none leading-none">
                Обязательный
              </label>
            </div>
          </div>

          {/* Описание */}
          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="На что потратили? (для ML)"
              className="resize-none min-h-[60px] text-sm py-2"
              rows={2}
              maxLength={120}
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 mt-2">
          <Button variant="outline" size="sm" className="h-9 flex-1 text-xs sm:text-sm">
            <QrCode className="w-3.5 h-3.5 mr-2" />
            Скан QR
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || isLoading} 
            size="sm"
            className="h-9 flex-1 bg-primary text-xs sm:text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}