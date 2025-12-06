"use client"

import { useState } from "react"
import { CalendarIcon, Download, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ru } from "date-fns/locale" // Для русского языка в календаре
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface OperationsHeaderProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function OperationsHeader({ 
  activeFilter, 
  onFilterChange, 
  searchQuery, 
  onSearchChange,
  dateRange,
  onDateRangeChange
}: OperationsHeaderProps) {
  const { token } = useAuth()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!token) return
    try {
      setIsExporting(true)
      const response = await fetch(apiUrl("/transactions/export"), {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Ошибка экспорта")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)
      link.download = `transactions_${timestamp}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">История операций</h1>

      <div className="flex flex-wrap items-center gap-4">
        
        {/* ВЫБОР ДАТЫ (POPOVER) */}
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal bg-transparent",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd LLL, y", { locale: ru })} -{" "}
                      {format(dateRange.to, "dd LLL, y", { locale: ru })}
                    </>
                  ) : (
                    format(dateRange.from, "dd LLL, y", { locale: ru })
                  )
                ) : (
                  <span>Выберите даты</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                locale={ru} // Локализация календаря
              />
              {/* Кнопка сброса дат */}
              <div className="p-3 border-t border-border">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="w-full"
                   onClick={() => onDateRangeChange(undefined)}
                 >
                   Сбросить фильтр
                 </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => onFilterChange("all")}
            className={activeFilter === "all" ? "bg-primary text-primary-foreground" : ""}
          >
            Все
          </Button>
          <Button
            variant={activeFilter === "expense" ? "default" : "outline"}
            onClick={() => onFilterChange("expense")}
            className={activeFilter === "expense" ? "bg-primary text-primary-foreground" : ""}
          >
            Расходы
          </Button>
          <Button
            variant={activeFilter === "income" ? "default" : "outline"}
            onClick={() => onFilterChange("income")}
            className={activeFilter === "income" ? "bg-primary text-primary-foreground" : ""}
          >
            Доходы
          </Button>
        </div>

        {/* Поиск */}
        <div className="flex-1 min-w-[200px]">
          <Input 
            type="search" 
            placeholder="Поиск..." 
            className="w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Экспорт */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleExport} 
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}