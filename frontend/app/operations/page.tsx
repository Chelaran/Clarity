"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { OperationsHeader } from "@/components/operations-header"
import { OperationsList } from "@/components/operations-list"

export default function OperationsPage() {
  const [filter, setFilter] = useState("all")
  // Добавляем состояние для поиска
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Передаем поиск в хедер */}
        <OperationsHeader 
          activeFilter={filter} 
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Передаем поиск в список */}
        <OperationsList 
          activeFilter={filter} 
          searchQuery={searchQuery} 
        />
      </main>
    </div>
  )
}