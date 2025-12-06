"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  MoreHorizontal,
  Send,
  TrendingUp,
  Lightbulb,
  TrendingDown,
  PiggyBank,
  ArrowLeft,
  Loader2,
  Bot,
  User
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

// Интерфейс сообщения для UI
interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: string
  // Опционально: карточка (пока API возвращает только текст, но оставим структуру для будущего)
  card?: {
    title: string
    value: string
    type: "warning" | "success" | "info"
  }
}

// Интерфейс сообщения от API (History)
interface ApiMessage {
  id: number
  user_id: number
  role: "assistant" | "user"
  content: string
  created_at: string
}

const quickActions = [
  { icon: TrendingUp, label: "Анализ трат" },
  { icon: PiggyBank, label: "Как сэкономить?" },
  { icon: TrendingDown, label: "Прогноз" },
  { icon: Lightbulb, label: "Куда вложить?" },
]

export function AiChat() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(true) // Загрузка истории
  const [isSending, setIsSending] = useState(false) // Отправка сообщения
  
  // Реф для автоскролла
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Функция форматирования времени из ISO строки
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  // Скролл вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

  // 1. Загрузка истории при старте
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const response = await fetch(`${apiUrl("/chat/history")}?limit=50`, {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (!response.ok) throw new Error("Ошибка загрузки истории")

        const data = await response.json()
        
        // Преобразуем формат API в формат UI
        // API возвращает массив в messages: []
        const historyMessages: Message[] = (data.messages || []).map((msg: ApiMessage) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: formatTime(msg.created_at)
        }))

        // Если истории нет, добавим приветственное сообщение
        if (historyMessages.length === 0) {
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: "Привет! Я ваш персональный финансовый помощник. Спросите меня о ваших финансах, и я проанализирую данные.",
            timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
          }])
        } else {
          // API обычно возвращает от старых к новым, если нет - нужно сделать .reverse()
          // Предполагаем, что сортировка правильная (старые сверху)
          setMessages(historyMessages)
        }

      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [token])

  // 2. Отправка сообщения
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || !token) return

    // Очищаем инпут
    setInput("")

    // Добавляем сообщение пользователя в UI (оптимистично)
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    }
    setMessages(prev => [...prev, userMsg])
    setIsSending(true)

    try {
      const response = await fetch(apiUrl("/chat"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: textToSend })
      })

      if (!response.ok) throw new Error("Ошибка отправки")

      const data = await response.json()

      // Добавляем ответ AI
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message, // API возвращает поле "message"
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      }
      setMessages(prev => [...prev, aiMsg])

    } catch (error) {
      console.error(error)
      // Сообщение об ошибке
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Извините, произошла ошибка соединения. Попробуйте еще раз.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  // Нажатие на быстрые действия
  const handleQuickAction = (label: string) => {
    handleSend(label)
  }

  // Нажатие Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b border-border bg-card p-4 sm:p-6 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg sm:text-xl font-semibold text-foreground">Финансовый Ассистент</h1>
                  <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">PRO</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-muted-foreground">В сети</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="container mx-auto max-w-4xl space-y-6">
          {/* Date Separator */}
          <div className="flex justify-center">
            <div className="text-xs font-medium text-muted-foreground bg-muted px-4 py-1.5 rounded-full">
              Сегодня, {new Date().toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Loading History Indicator */}
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Messages */}
          {!isLoading && (
            <div className="space-y-6 pb-4">
              {messages.map((message) => {
                const isAi = message.role === "assistant"
                
                return (
                  <div key={message.id} className={cn("flex gap-3", !isAi && "flex-row-reverse")}>
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                      isAi ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {isAi ? <span className="text-xs font-bold">AI</span> : <User className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className={cn("max-w-[85%] sm:max-w-[75%]", !isAi && "flex flex-col items-end")}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm font-medium text-foreground">
                          {isAi ? "Clarity AI" : "Вы"}
                        </span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>

                      <div className={cn(
                        "rounded-2xl p-4 text-sm sm:text-base leading-relaxed whitespace-pre-wrap shadow-sm",
                        isAi 
                          ? "bg-card border border-border rounded-tl-none text-foreground" 
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}>
                        {message.content}

                        {/* Card if present (Заготовка под будущие фичи) */}
                        {message.card && (
                          <div className="mt-4 bg-background/50 border border-border/50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                message.card.type === "warning" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                              )}>
                                <TrendingUp className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-medium opacity-80 mb-1">{message.card.title}</div>
                                <div className="text-xl font-bold">{message.card.value}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions for AI messages */}
                      {isAi && (
                        <div className="flex items-center gap-1 mt-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {/* Typing Indicator */}
              {isSending && (
                 <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                     <span className="text-xs font-bold text-primary-foreground">AI</span>
                   </div>
                   <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4 flex items-center gap-1 w-20">
                     <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-border bg-card p-4 sm:p-6 sticky bottom-0">
        <div className="container mx-auto max-w-4xl space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.label)}
                  disabled={isSending || isLoading}
                  className="text-muted-foreground hover:text-foreground hover:border-primary bg-background"
                >
                  <Icon className="w-4 h-4 mr-2 text-primary" />
                  {action.label}
                </Button>
              )
            })}
          </div>

          {/* Input Field */}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || isLoading}
              placeholder="Спросите о своих финансах..."
              className="w-full px-6 py-4 pr-14 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary hover:bg-primary/90 transition-all"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-center text-muted-foreground">
            AI анализирует ваши транзакции и Health Score для формирования ответа.
          </p>
        </div>
      </div>
    </div>
  )
}