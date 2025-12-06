"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { OperationsHeader } from "@/components/operations-header"
import { OperationsList } from "@/components/operations-list"
import { DateRange } from "react-day-picker"

export default function OperationsPage() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Состояние диапазона дат
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
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
      </main>
    </div>
  )
}