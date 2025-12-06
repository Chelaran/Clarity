"use client"

import { useState } from "react"
import { Calendar, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"

interface OperationsHeaderProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function OperationsHeader({ 
  activeFilter, 
  onFilterChange, 
  searchQuery, 
  onSearchChange 
}: OperationsHeaderProps) {
  const { token } = useAuth()
  const [isExporting, setIsExporting] = useState(false)

  // Функция скачивания CSV
  const handleExport = async () => {
    if (!token) return

    try {
      setIsExporting(true)

      const response = await fetch(apiUrl("/transactions/export"), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось экспортировать транзакции")
      }

      // 1. Получаем данные в виде Blob
      const blob = await response.blob()
      
      // 2. Создаем URL для этого Blob
      const url = window.URL.createObjectURL(blob)
      
      // 3. Создаем временную ссылку
      const link = document.createElement("a")
      link.href = url
      
      // Генерируем имя файла: transactions_20231025_123000.csv
      const now = new Date()
      // Форматируем дату в YYYYMMDD_HHMMSS
      const timestamp = now.toISOString().replace(/[-:T.]/g, "").slice(0, 14)
      link.download = `transactions_${timestamp}.csv`
      
      // 4. Добавляем ссылку в документ, кликаем и удаляем
      document.body.appendChild(link)
      link.click()
      
      // Очистка
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Ошибка экспорта:", error)
      alert("Ошибка при скачивании файла")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">История операций</h1>

      <div className="flex flex-wrap items-center gap-4">
        {/* Month selector (визуальный) */}
        <Button variant="outline" className="gap-2 bg-transparent">
          <Calendar className="w-4 h-4" />
          Октябрь 2023
        </Button>

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
            placeholder="Поиск по категории или описанию..." 
            className="w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Кнопка экспорта */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleExport} 
          disabled={isExporting}
          title="Скачать CSV"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}