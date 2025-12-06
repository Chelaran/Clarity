"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { apiUrl, apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"

type Period = "month" | "quarter" | "year"

export function AnalyticsHeader() {
  const { token } = useAuth()
  const [period, setPeriod] = useState<Period>("month")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Вычисляем даты начала и конца периода
  const getDateRange = (date: Date, period: Period): { startDate: string; endDate: string } => {
    const year = date.getFullYear()
    const month = date.getMonth()

    switch (period) {
      case "month": {
        const start = new Date(year, month, 1)
        const end = new Date(year, month + 1, 0, 23, 59, 59)
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        }
      }
      case "quarter": {
        const quarter = Math.floor(month / 3)
        const start = new Date(year, quarter * 3, 1)
        const end = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59)
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        }
      }
      case "year": {
        const start = new Date(year, 0, 1)
        const end = new Date(year, 11, 31, 23, 59, 59)
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
        }
      }
    }
  }

  const handleExport = async () => {
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Необходима авторизация",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExporting(true)
      const { startDate, endDate } = getDateRange(selectedDate, period)
      
      // Строим URL правильно для относительных путей
      const baseUrl = apiUrl("/transactions/export")
      const separator = baseUrl.includes("?") ? "&" : "?"
      const url = `${baseUrl}${separator}start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`

      // Используем прямой fetch для blob, так как apiFetch не поддерживает blob
      const response = await fetch(url, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Export error:", errorText)
        throw new Error("Ошибка экспорта")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      
      const periodLabel = period === "month" ? "месяц" : period === "quarter" ? "квартал" : "год"
      const dateLabel = format(selectedDate, "MMM_yyyy", { locale: ru })
      link.download = `transactions_${periodLabel}_${dateLabel}.csv`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Успешно",
        description: "Транзакции экспортированы",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать транзакции",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSaveReport = async () => {
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Необходима авторизация",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const { startDate, endDate } = getDateRange(selectedDate, period)
      
      // Строим URL правильно для относительных путей
      const baseUrl = apiUrl("/transactions/report")
      const separator = baseUrl.includes("?") ? "&" : "?"
      const url = `${baseUrl}${separator}start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`

      const response = await fetch(url, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Report error:", errorText)
        throw new Error("Ошибка сохранения отчета")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      
      const periodLabel = period === "month" ? "месяц" : period === "quarter" ? "квартал" : "год"
      const dateLabel = format(selectedDate, "MMM_yyyy", { locale: ru })
      link.download = `report_${periodLabel}_${dateLabel}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Успешно",
        description: "Детальный отчет сохранен",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить отчет",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDateDisplay = (date: Date, period: Period): string => {
    switch (period) {
      case "month":
        return format(date, "LLL yyyy", { locale: ru })
      case "quarter": {
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `Q${quarter} ${date.getFullYear()}`
      }
      case "year":
        return date.getFullYear().toString()
    }
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      {/* 1. ЗАГОЛОВОК */}
      <h1 className="text-2xl sm:text-3xl font-bold shrink-0">Аналитика</h1>

      {/* 2. КОНТЕЙНЕР КНОПОК */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:justify-end w-full md:w-auto">
        
        {/* ГРУППА 1: Переключатель периодов (Месяц/Квартал/Год) */}
        <div className="bg-card border border-border rounded-lg p-1 flex w-full sm:w-auto shrink-0">
          <Button
            variant={period === "month" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs sm:text-sm flex-1 sm:flex-none"
            onClick={() => setPeriod("month")}
          >
            Месяц
          </Button>
          <Button
            variant={period === "quarter" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs sm:text-sm flex-1 sm:flex-none"
            onClick={() => setPeriod("quarter")}
          >
            Квартал
          </Button>
          <Button
            variant={period === "year" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs sm:text-sm flex-1 sm:flex-none"
            onClick={() => setPeriod("year")}
          >
            Год
          </Button>
        </div>

        {/* ГРУППА 2: Кнопки действий */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Выбор даты */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-transparent flex-1 sm:flex-none justify-center shrink-0"
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {formatDateDisplay(selectedDate, period)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setCalendarOpen(false)
                  }
                }}
                defaultMonth={selectedDate}
                locale={ru}
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear() + 1}
              />
            </PopoverContent>
          </Popover>

          {/* Экспорт */}
          <Button
            variant="outline"
            className="gap-2 bg-transparent flex-1 sm:flex-none justify-center shrink-0"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Экспорт
          </Button>

          {/* Сохранить отчет */}
          <Button
            className="gap-2 bg-[#1a1f2e] hover:bg-[#1a1f2e]/90 text-white flex-1 sm:flex-none justify-center shrink-0 min-w-[140px]"
            onClick={handleSaveReport}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap">Сохранить отчет</span>
          </Button>
        </div>
        
      </div>
    </div>
  )
}
