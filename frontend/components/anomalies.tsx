"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Loader2, Bell } from "lucide-react"
import { Card } from "@/components/ui/card"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function Anomalies() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${apiUrl("/notifications")}?limit=10&unread_only=false`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить уведомления")
        }

        const data: Notification[] = await response.json()
        // Фильтруем ТОЛЬКО аномалии (не превышения лимитов)
        const filtered = data.filter(n => n.type === "anomaly")
        setNotifications(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки")
        console.error("Anomalies error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [token, refreshIndex])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Сегодня"
    if (diffDays === 1) return "Вчера"
    if (diffDays < 7) return `${diffDays} дн. назад`
    
    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
    return `${date.getDate()} ${months[date.getMonth()]}`
  }

  // Извлекаем сумму и процент из сообщения
  const parseNotification = (notification: Notification) => {
    const message = notification.message
    
    // Ищем сумму в формате "Сумма: -50000.00₽" или "потрачено 111876.00₽"
    const amountMatch = message.match(/(?:Сумма:|потрачено)\s*([-\d\s,]+\.?\d*)\s*₽?/i)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/\s/g, '').replace(',', '.')) : null
    
    // Ищем процент превышения в формате "(452%)"
    const percentMatch = message.match(/\((\d+(?:\.\d+)?)%\)/)
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null
    
    // Ищем категорию
    const categoryMatch = message.match(/Категория[:\s]+['"]?([^'":,]+)['"]?/i)
    const category = categoryMatch ? categoryMatch[1].trim() : null
    
    return { amount, percent, category }
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
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Аномалии</h3>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Аномалии</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Нет аномалий и превышений лимитов</p>
        </div>
      </Card>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Аномалии</h3>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs font-medium bg-red-500 text-white px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Нет аномальных транзакций
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {notifications.map((notification) => {
            const parsed = parseNotification(notification)
            
            return (
              <div 
                key={notification.id} 
                className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-foreground flex-1">
                    {notification.title}
                  </h4>
                  {parsed.amount && (
                    <span className="text-sm font-semibold text-red-600 shrink-0">
                      {Math.abs(parsed.amount).toLocaleString("ru-RU")} ₽
                    </span>
                  )}
                </div>
                
                {parsed.category && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs text-muted-foreground">Категория:</span>
                    <span className="text-xs font-medium text-foreground">{parsed.category}</span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    Аномалия
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
