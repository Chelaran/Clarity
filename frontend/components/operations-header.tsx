"use client"

import { Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function OperationsHeader() {
  const [activeFilter, setActiveFilter] = useState("all")

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">История операций</h1>

      <div className="flex flex-wrap items-center gap-4">
        {/* Month selector */}
        <Button variant="outline" className="gap-2 bg-transparent">
          <Calendar className="w-4 h-4" />
          Октябрь 2023
        </Button>

        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => setActiveFilter("all")}
            className={activeFilter === "all" ? "bg-primary text-primary-foreground" : ""}
          >
            Все
          </Button>
          <Button
            variant={activeFilter === "expenses" ? "default" : "outline"}
            onClick={() => setActiveFilter("expenses")}
            className={activeFilter === "expenses" ? "bg-primary text-primary-foreground" : ""}
          >
            Расходы
          </Button>
          <Button
            variant={activeFilter === "income" ? "default" : "outline"}
            onClick={() => setActiveFilter("income")}
            className={activeFilter === "income" ? "bg-primary text-primary-foreground" : ""}
          >
            Доходы
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input type="search" placeholder="Поиск..." className="w-full" />
        </div>

        {/* Export button */}
        <Button variant="outline" size="icon">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
