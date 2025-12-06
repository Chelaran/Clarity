"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"
import { Loader2, Plus, Edit, Trash2, Calendar, Percent } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

interface Deposit {
  id: number
  amount: number
  interest_rate: number
  description: string
  open_date: string
  close_date: string | null
  term_months: number
  created_at: string
}

export function DepositsList() {
  const { token } = useAuth()
  const { refreshIndex, triggerRefresh } = useRefresh()

  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    amount: "",
    interest_rate: "",
    description: "",
    open_date: "",
    close_date: "",
    term_months: "",
    isClosed: false,
  })

  useEffect(() => {
    const fetchDeposits = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${apiUrl("/deposits")}?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить вклады")
        }

        const data = await response.json()
        setDeposits(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching deposits:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeposits()
  }, [token, refreshIndex])

  const handleCreate = () => {
    setEditForm({
      amount: "",
      interest_rate: "",
      description: "",
      open_date: "",
      close_date: "",
      term_months: "",
      isClosed: false,
    })
    setSelectedDeposit(null)
    setIsEditing(true)
  }

  const handleEdit = (deposit: Deposit) => {
    const openDate = new Date(deposit.open_date)
    const formattedOpenDate = `${String(openDate.getDate()).padStart(2, "0")}.${String(openDate.getMonth() + 1).padStart(2, "0")}.${openDate.getFullYear()}`
    
    let formattedCloseDate = ""
    if (deposit.close_date) {
      const closeDate = new Date(deposit.close_date)
      formattedCloseDate = `${String(closeDate.getDate()).padStart(2, "0")}.${String(closeDate.getMonth() + 1).padStart(2, "0")}.${closeDate.getFullYear()}`
    }
    
    setEditForm({
      amount: deposit.amount.toString(),
      interest_rate: deposit.interest_rate.toString(),
      description: deposit.description || "",
      open_date: formattedOpenDate,
      close_date: formattedCloseDate,
      term_months: deposit.term_months.toString(),
      isClosed: !!deposit.close_date,
    })
    setSelectedDeposit(deposit)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!token) return

    setIsSaving(true)
    try {
      const [openDay, openMonth, openYear] = editForm.open_date.split(".")
      const formattedOpenDate = `${openYear}-${openMonth}-${openDay}`

      const payload: any = {
        amount: parseFloat(editForm.amount),
        interest_rate: parseFloat(editForm.interest_rate) || 0,
        description: editForm.description,
        open_date: formattedOpenDate,
        term_months: parseInt(editForm.term_months) || 0,
      }

      if (editForm.isClosed && editForm.close_date) {
        const [closeDay, closeMonth, closeYear] = editForm.close_date.split(".")
        payload.close_date = `${closeYear}-${closeMonth}-${closeDay}`
      } else if (selectedDeposit && !editForm.isClosed) {
        // Если вклад был закрыт, но теперь открываем его
        payload.close_date = ""
      }

      let response
      if (selectedDeposit) {
        // Обновление
        response = await fetch(`${apiUrl("/deposits")}/${selectedDeposit.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        // Создание
        response = await fetch(apiUrl("/deposits"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        throw new Error("Не удалось сохранить вклад")
      }

      triggerRefresh()
      setIsEditing(false)
      setSelectedDeposit(null)
      setEditForm({
        amount: "",
        interest_rate: "",
        description: "",
        open_date: "",
        close_date: "",
        term_months: "",
        isClosed: false,
      })
    } catch (err) {
      console.error("Error saving deposit:", err)
      alert("Ошибка при сохранении вклада")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDeposit || !token) return

    setIsDeleting(true)
    try {
      const response = await fetch(`${apiUrl("/deposits")}/${selectedDeposit.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить вклад")
      }

      triggerRefresh()
      setShowDeleteDialog(false)
      setSelectedDeposit(null)
    } catch (err) {
      console.error("Error deleting deposit:", err)
      alert("Ошибка при удалении вклада")
    } finally {
      setIsDeleting(false)
    }
  }

  const calculateMaturityDate = (deposit: Deposit) => {
    if (deposit.term_months === 0) return null
    const openDate = new Date(deposit.open_date)
    const maturityDate = new Date(openDate)
    maturityDate.setMonth(maturityDate.getMonth() + deposit.term_months)
    return maturityDate
  }

  const calculateInterest = (deposit: Deposit) => {
    if (deposit.interest_rate === 0) return null
    const annualInterest = (deposit.amount * deposit.interest_rate) / 100
    return annualInterest
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
        <h2 className="text-xl font-semibold">Мои вклады</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить вклад
        </Button>
      </div>

      {deposits.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">У вас пока нет вкладов</p>
            <Button onClick={handleCreate} className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Добавить первый вклад
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {deposits.map((deposit) => {
              const maturityDate = calculateMaturityDate(deposit)
              const annualInterest = calculateInterest(deposit)
              const isActive = !deposit.close_date

              return (
                <motion.div
                  key={deposit.id}
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
                          {deposit.description || "Банковский вклад"}
                        </h3>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {isActive ? "Активный" : "Закрыт"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(deposit)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDeposit(deposit)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Сумма вклада</p>
                        <p className="text-lg font-semibold">
                          {deposit.amount.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>

                      {deposit.interest_rate > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            Процентная ставка
                          </p>
                          <p className="text-lg font-semibold">
                            {deposit.interest_rate.toFixed(2)}% годовых
                          </p>
                          {annualInterest && (
                            <p className="text-xs text-muted-foreground">
                              ~{annualInterest.toLocaleString("ru-RU")} ₽ в год
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Дата открытия
                        </p>
                        <p className="text-sm">
                          {format(new Date(deposit.open_date), "dd MMMM yyyy", { locale: ru })}
                        </p>
                      </div>

                      {deposit.close_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Дата закрытия</p>
                          <p className="text-sm">
                            {format(new Date(deposit.close_date), "dd MMMM yyyy", { locale: ru })}
                          </p>
                        </div>
                      )}

                      {maturityDate && isActive && (
                        <div>
                          <p className="text-sm text-muted-foreground">Дата окончания</p>
                          <p className="text-sm">
                            {format(maturityDate, "dd MMMM yyyy", { locale: ru })}
                          </p>
                        </div>
                      )}

                      {deposit.term_months > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Срок</p>
                          <p className="text-sm">
                            {deposit.term_months} {deposit.term_months === 1 ? "месяц" : deposit.term_months < 5 ? "месяца" : "месяцев"}
                            {deposit.term_months === 0 && " (до востребования)"}
                          </p>
                        </div>
                      )}
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
              {selectedDeposit ? "Редактировать вклад" : "Добавить вклад"}
            </DialogTitle>
            <DialogDescription>
              {selectedDeposit
                ? "Измените информацию о вкладе"
                : "Заполните информацию о новом вкладе"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма вклада (₽)</Label>
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
              <Label htmlFor="interest_rate">Процентная ставка (% годовых)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                placeholder="Введите процентную ставку"
                value={editForm.interest_rate}
                onChange={(e) => setEditForm({ ...editForm, interest_rate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание (название банка, тип вклада)</Label>
              <Textarea
                id="description"
                placeholder="Например: Сбербанк, накопительный счет"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="open_date">Дата открытия (ДД.ММ.ГГГГ)</Label>
              <Input
                id="open_date"
                type="text"
                placeholder="ДД.ММ.ГГГГ"
                value={editForm.open_date}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  let formatted = value
                  if (value.length > 2) formatted = value.slice(0, 2) + "." + value.slice(2)
                  if (value.length > 4) formatted = value.slice(0, 2) + "." + value.slice(2, 4) + "." + value.slice(4, 8)
                  setEditForm({ ...editForm, open_date: formatted })
                }}
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="term_months">Срок в месяцах (0 = до востребования)</Label>
              <Input
                id="term_months"
                type="number"
                placeholder="Введите срок в месяцах"
                value={editForm.term_months}
                onChange={(e) => setEditForm({ ...editForm, term_months: e.target.value })}
                min="0"
              />
            </div>

            {selectedDeposit && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isClosed"
                    checked={editForm.isClosed}
                    onCheckedChange={(checked) =>
                      setEditForm({ ...editForm, isClosed: checked as boolean })
                    }
                  />
                  <Label htmlFor="isClosed" className="cursor-pointer">
                    Вклад закрыт
                  </Label>
                </div>

                {editForm.isClosed && (
                  <div className="space-y-2">
                    <Label htmlFor="close_date">Дата закрытия (ДД.ММ.ГГГГ)</Label>
                    <Input
                      id="close_date"
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={editForm.close_date}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        let formatted = value
                        if (value.length > 2) formatted = value.slice(0, 2) + "." + value.slice(2)
                        if (value.length > 4)
                          formatted =
                            value.slice(0, 2) + "." + value.slice(2, 4) + "." + value.slice(4, 8)
                        setEditForm({ ...editForm, close_date: formatted })
                      }}
                      maxLength={10}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !editForm.amount || !editForm.open_date}
            >
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
            <AlertDialogTitle>Удалить вклад?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот вклад? Это действие нельзя отменить.
              {selectedDeposit && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p className="font-medium">
                    {selectedDeposit.description || "Банковский вклад"}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedDeposit.amount.toLocaleString("ru-RU")} ₽
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

