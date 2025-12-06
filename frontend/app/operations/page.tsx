"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { OperationsHeader } from "@/components/operations-header"
import { OperationsList } from "@/components/operations-list"
import { DateRange } from "react-day-picker"
import { Loader2 } from "lucide-react"

function OperationsContent() {
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Состояние диапазона дат
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Читаем фильтр из URL при загрузке страницы
  useEffect(() => {
    const filterParam = searchParams.get("filter")
    if (filterParam === "income" || filterParam === "expense") {
      setFilter(filterParam)
    }
  }, [searchParams])

  return (
    <>
      <OperationsHeader 
        activeFilter={filter} 
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        // Передаем даты и функцию их изменения
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
      
      <OperationsList 
        activeFilter={filter} 
        searchQuery={searchQuery}
        // Передаем даты в список для фильтрации запроса
        dateRange={dateRange}
      />
    </>
  )
}

export default function OperationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <OperationsContent />
        </Suspense>
      </main>
    </div>
  )
}