"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Plus, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddOperationModal } from "@/components/add-operation-modal"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context"

export function QuickActions() {
  const { token } = useAuth()
  const { refreshIndex, triggerRefresh } = useRefresh()
  
  // Состояния
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Реф для скрытого инпута
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Клик по кнопке "Импорт" вызывает клик по скрытому инпуту
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  // Обработка выбора файла
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    try {
      setIsUploading(true)

      // Создаем FormData для отправки файла
      const formData = new FormData()
      formData.append("file", file)
      // Включаем пропуск ошибок, чтобы загрузить всё, что можно
      formData.append("skip_errors", "true") 

      const response = await fetch(apiUrl("/transactions/import"), {
        method: "POST",
        headers: {
          // Content-Type не указываем вручную для FormData, браузер сам поставит boundary
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Ошибка при загрузке файла")
      }

      const data = await response.json()

      // Логика обработки ответа
      if (data.imported > 0) {
        // Если есть успешные записи - обновляем интерфейс
        triggerRefresh()
      }

      // Формируем сообщение для пользователя
      let message = `Обработано строк: ${data.total}\nУспешно импортировано: ${data.imported}`
      
      if (data.failed > 0) {
        message += `\n\nНе удалось загрузить: ${data.failed} строк.`
        if (data.errors && data.errors.length > 0) {
          // Показываем первые 3 ошибки, чтобы не спамить
          const errorsToShow = data.errors.slice(0, 3).join("\n")
          message += `\nПримеры ошибок:\n${errorsToShow}`
          if (data.errors.length > 3) message += "\n..."
        }
      }

      alert(message) // Простой алерт с отчетом

    } catch (error) {
      console.error(error)
      alert("Не удалось загрузить файл. Проверьте формат CSV.")
    } finally {
      setIsUploading(false)
      // Сбрасываем инпут, чтобы можно было загрузить тот же файл повторно если нужно
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <Card className="p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">БЫСТРЫЕ ДЕЙСТВИЯ</p>

        <div className="space-y-2">
          {/* Кнопка "Добавить операцию" */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-foreground hover:bg-muted"
            onClick={() => setIsModalOpen(true)}
            disabled={isUploading}
          >
            <Plus className="w-4 h-4 mr-3 text-muted-foreground" />
            Добавить операцию
          </Button>

          {/* Кнопка "Импорт данных" */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-foreground hover:bg-muted"
            onClick={handleImportClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-3 text-muted-foreground animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-3 text-muted-foreground" />
            )}
            {isUploading ? "Загрузка..." : "Импорт данных"}
          </Button>

          {/* Скрытый инпут для файла */}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".csv" // Принимаем только CSV
            onChange={handleFileChange}
          />
        </div>
      </Card>

      <AddOperationModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  )
}