"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"
import { Loader2, Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Investment {
  id: number
  amount: number
  type: string
  description: string
  current_value: number
  date: string
  created_at: string
}

const investmentTypes = [
  { value: "акции", label: "Акции" },
  { value: "облигации", label: "Облигации" },
  { value: "криптовалюта", label: "Криптовалюта" },
  { value: "фонды", label: "Инвестиционные фонды" },
  { value: "металлы", label: "Драгоценные металлы" },
  { value: "недвижимость", label: "Недвижимость" },
  { value: "другое", label: "Другое" },
]

export function InvestmentsList() {
  const { token } = useAuth()
  const { refreshIndex, triggerRefresh } = useRefresh()

  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    amount: "",
    type: "",
    description: "",
    current_value: "",
    date: "",
  })

  useEffect(() => {
    const fetchInvestments = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${apiUrl("/investments")}?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить инвестиции")
        }

        const data = await response.json()
        setInvestments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching investments:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvestments()
  }, [token, refreshIndex])

  const handleCreate = () => {
    setEditForm({
      amount: "",
      type: "",
      description: "",
      current_value: "",
      date: "",
    })
    setSelectedInvestment(null)
    setIsEditing(true)
  }

  const handleEdit = (investment: Investment) => {
    const date = new Date(investment.date)
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
    
    setEditForm({
      amount: investment.amount.toString(),
      type: investment.type || "",
      description: investment.description || "",
      current_value: investment.current_value?.toString() || "",
      date: formattedDate,
    })
    setSelectedInvestment(investment)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!token) return

    setIsSaving(true)
    try {
      const [day, month, year] = editForm.date.split(".")
      const formattedDate = `${year}-${month}-${day}`

      const payload = {
        amount: parseFloat(editForm.amount),
        type: editForm.type,
        description: editForm.description,
        current_value: editForm.current_value ? parseFloat(editForm.current_value) : 0,
        date: formattedDate,
      }

      let response
      if (selectedInvestment) {
        // Обновление
        response = await fetch(`${apiUrl("/investments")}/${selectedInvestment.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        // Создание
        response = await fetch(apiUrl("/investments"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        throw new Error("Не удалось сохранить инвестицию")
      }

      triggerRefresh()
      setIsEditing(false)
      setSelectedInvestment(null)
      setEditForm({ amount: "", type: "", description: "", current_value: "", date: "" })
    } catch (err) {
      console.error("Error saving investment:", err)
      alert("Ошибка при сохранении инвестиции")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInvestment || !token) return

    setIsDeleting(true)
    try {
      const response = await fetch(`${apiUrl("/investments")}/${selectedInvestment.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить инвестицию")
      }

      triggerRefresh()
      setShowDeleteDialog(false)
      setSelectedInvestment(null)
    } catch (err) {
      console.error("Error deleting investment:", err)
      alert("Ошибка при удалении инвестиции")
    } finally {
      setIsDeleting(false)
    }
  }

  const calculateProfit = (investment: Investment) => {
    if (!investment.current_value || investment.current_value === 0) return null
    const profit = investment.current_value - investment.amount
    const profitPercent = (profit / investment.amount) * 100
    return { profit, profitPercent }
  }

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

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Мои инвестиции</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить инвестицию
        </Button>
      </div>

      {investments.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">У вас пока нет инвестиций</p>
            <Button onClick={handleCreate} className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую инвестицию
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {investments.map((investment) => {
              const profit = calculateProfit(investment)
              
              return (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {investment.description || investment.type || "Инвестиция"}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                          {investment.type || "Не указан"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(investment)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedInvestment(investment)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Сумма вложения</p>
                        <p className="text-lg font-semibold">
                          {investment.amount.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>

                      {investment.current_value > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Текущая стоимость</p>
                          <p className="text-lg font-semibold">
                            {investment.current_value.toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      )}

                      {profit && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {profit.profit >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <p
                              className={`text-sm font-medium ${
                                profit.profit >= 0 ? "text-emerald-500" : "text-red-500"
                              }`}
                            >
                              {profit.profit >= 0 ? "+" : ""}
                              {profit.profit.toLocaleString("ru-RU")} ₽ (
                              {profit.profitPercent >= 0 ? "+" : ""}
                              {profit.profitPercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">Дата покупки</p>
                        <p className="text-sm">
                          {format(new Date(investment.date), "dd MMMM yyyy", { locale: ru })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Модальное окно редактирования/создания */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInvestment ? "Редактировать инвестицию" : "Добавить инвестицию"}
            </DialogTitle>
            <DialogDescription>
              {selectedInvestment
                ? "Измените информацию об инвестиции"
                : "Заполните информацию о новой инвестиции"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма вложения (₽)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Введите сумму"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Тип инвестиции</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Например: Акции Сбербанка, ETF на S&P 500"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">Текущая стоимость (₽) (опционально)</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                placeholder="Введите текущую стоимость"
                value={editForm.current_value}
                onChange={(e) => setEditForm({ ...editForm, current_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Дата покупки (ДД.ММ.ГГГГ)</Label>
              <Input
                id="date"
                type="text"
                placeholder="ДД.ММ.ГГГГ"
                value={editForm.date}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  let formatted = value
                  if (value.length > 2) formatted = value.slice(0, 2) + "." + value.slice(2)
                  if (value.length > 4) formatted = value.slice(0, 2) + "." + value.slice(2, 4) + "." + value.slice(4, 8)
                  setEditForm({ ...editForm, date: formatted })
                }}
                maxLength={10}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editForm.amount || !editForm.date}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить инвестицию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту инвестицию? Это действие нельзя отменить.
              {selectedInvestment && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p className="font-medium">
                    {selectedInvestment.description || selectedInvestment.type || "Инвестиция"}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedInvestment.amount.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

