"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"
import { Loader2, Bell, CheckCheck, AlertTriangle, TrendingDown, CreditCard, Wallet, Check } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "anomaly":
      return AlertTriangle
    case "category_limit":
      return CreditCard
    case "cushion":
      return TrendingDown
    case "limit":
      return Wallet
    default:
      return Bell
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case "anomaly":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20"
    case "category_limit":
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20"
    case "cushion":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
    case "limit":
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
    default:
      return "text-muted-foreground bg-muted"
  }
}

export default function NotificationsPage() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingRead, setIsMarkingRead] = useState<number | null>(null)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const unreadOnly = filter === "unread" ? "true" : "false"
        const response = await fetch(`${apiUrl("/notifications")}?limit=100&unread_only=${unreadOnly}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить уведомления")
        }

        const data = await response.json()
        setNotifications(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        console.error("Error fetching notifications:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [token, refreshIndex, filter])

  const handleMarkAsRead = async (id: number) => {
    if (!token) return

    setIsMarkingRead(id)
    try {
      const response = await fetch(`${apiUrl("/notifications")}/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось пометить уведомление как прочитанное")
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
      alert("Ошибка при обновлении уведомления")
    } finally {
      setIsMarkingRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!token) return

    try {
      const response = await fetch(`${apiUrl("/notifications")}/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось пометить все уведомления как прочитанные")
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
      alert("Ошибка при обновлении уведомлений")
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.is_read)
    : notifications

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-[1400px]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Уведомления</h1>
              <p className="text-muted-foreground mt-2">
                Важные изменения в вашем финансовом состоянии
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline">
                <CheckCheck className="w-4 h-4 mr-2" />
                Прочитать все ({unreadCount})
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Все ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Непрочитанные ({unreadCount})
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="p-6">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {filter === "unread" ? "Нет непрочитанных уведомлений" : "Нет уведомлений"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "Все уведомления прочитаны"
                  : "Здесь будут отображаться важные уведомления о ваших финансах"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const colorClasses = getNotificationColor(notification.type)

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`p-6 hover:shadow-md transition-shadow ${
                        !notification.is_read ? "border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg ${colorClasses} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <Badge variant="secondary" className="text-xs">
                                    Новое
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={isMarkingRead === notification.id}
                                className="shrink-0"
                              >
                                {isMarkingRead === notification.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Прочитано
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_at), "dd MMMM yyyy, HH:mm", {
                                locale: ru,
                              })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {notification.type === "anomaly"
                                ? "Аномалия"
                                : notification.type === "category_limit"
                                ? "Лимит категории"
                                : notification.type === "cushion"
                                ? "Финансовая подушка"
                                : "Уведомление"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

