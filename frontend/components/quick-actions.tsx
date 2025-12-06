"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Plus, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddOperationModal } from "@/components/add-operation-modal" // Импортируем модалку

export function QuickActions() {
  // Состояние для открытия/закрытия модального окна
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card className="p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">БЫСТРЫЕ ДЕЙСТВИЯ</p>

        <div className="space-y-2">
          {/* Кнопка "Добавить операцию" открывает модалку */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-foreground hover:bg-muted"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-3 text-muted-foreground" />
            Добавить операцию
          </Button>

          <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
            <Download className="w-4 h-4 mr-3 text-muted-foreground" />
            Импорт данных
          </Button>
        </div>
      </Card>

      {/* Сама модалка, которая отображается поверх всего, если isModalOpen === true */}
      <AddOperationModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  )
}