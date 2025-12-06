"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Loader2, AlertTriangle, TrendingDown, CreditCard, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/components/refresh-context"
import { format, formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"

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
      return "text-amber-600 dark:text-amber-400"
    case "category_limit":
      return "text-orange-600 dark:text-orange-400"
    case "cushion":
      return "text-red-600 dark:text-red-400"
    case "limit":
      return "text-blue-600 dark:text-blue-400"
    default:
      return "text-muted-foreground"
  }
}

export function NotificationsDropdown() {
  const { token } = useAuth()
  const { refreshIndex } = useRefresh()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState<number | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const response = await fetch(`${apiUrl("/notifications")}?limit=10&unread_only=false`, {
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
        console.error("Error fetching notifications:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [token, refreshIndex, isOpen])

  const unreadCount = notifications.filter((n) => !n.is_read).length

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
    } finally {
      setIsMarkingRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return

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
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Уведомления</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Прочитать все
              </Button>
            )}
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="text-xs">
                Все
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Нет уведомлений</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const iconColor = getNotificationColor(notification.type)

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </span>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={isMarkingRead === notification.id}
                            >
                              {isMarkingRead === notification.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3 mr-1" />
                              )}
                              Прочитано
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

