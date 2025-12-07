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
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown" // 1. Импортируем

// Интерфейс сообщения
interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    } catch (e) { return "" }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

  // Получение URL API
  const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || '/api'

  // 1. ЗАГРУЗКА ИСТОРИИ
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) { setIsLoading(false); return }

      try {
        setIsLoading(true)
        const response = await fetch(`${getBaseUrl()}/chat/history?limit=50`, {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })

        if (!response.ok) {
           console.error("Error fetching history:", response.status)
           return
        }

        const data = await response.json()
        
        const historyMessages: Message[] = (data.messages || []).map((msg: ApiMessage) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: formatTime(msg.created_at)
        }))

        if (historyMessages.length === 0) {
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: "Привет! Я ваш финансовый ассистент. Спросите меня о балансе, расходах или попросите совета.",
            timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
          }])
        } else {
          setMessages(historyMessages)
        }

      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [token])

  // 2. ОТПРАВКА СООБЩЕНИЯ
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || !token) return

    setInput("")

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    }
    setMessages(prev => [...prev, userMsg])
    setIsSending(true)

    try {
      const response = await fetch(`${getBaseUrl()}/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: textToSend })
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const data = await response.json()

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      }
      setMessages(prev => [...prev, aiMsg])

    } catch (error) {
      console.error("Send Error:", error)
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Не удалось получить ответ. Попробуйте позже.",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickAction = (label: string) => handleSend(label)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="flex justify-center">
            <div className="text-xs font-medium text-muted-foreground bg-muted px-4 py-1.5 rounded-full">
              Сегодня
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && (
            <div className="space-y-6 pb-4">
              {messages.map((message) => {
                const isAi = message.role === "assistant"
                return (
                  <div key={message.id} className={cn("flex gap-3", !isAi && "flex-row-reverse")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                      isAi ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {isAi ? <span className="text-[10px] font-bold">AI</span> : <User className="w-4 h-4" />}
                    </div>

                    <div className={cn("max-w-[85%] sm:max-w-[75%]", !isAi && "flex flex-col items-end")}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm font-medium text-foreground">
                          {isAi ? "Clarity AI" : "Вы"}
                        </span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>

                      <div className={cn(
                        "rounded-2xl p-4 text-sm sm:text-base shadow-sm overflow-hidden",
                        isAi 
                          ? "bg-card border border-border rounded-tl-none text-foreground" 
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}>
                        {/* ИСПОЛЬЗУЕМ REACT MARKDOWN */}
                        <ReactMarkdown
                          components={{
                            // Стилизация жирного текста
                            strong: ({node, ...props}) => <span className="font-bold text-primary-700 dark:text-primary-300" {...props} />,
                            // Стилизация списков
                            ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                            // Стилизация параграфов (чтобы не было лишних отступов)
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            // Стилизация ссылок
                            a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {isAi && (
                        <div className="flex items-center gap-1 mt-1">
                          <Button 
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                          >
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
              
              {isSending && (
                 <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                     <span className="text-[10px] font-bold text-primary-foreground">AI</span>
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

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4 sm:p-6 sticky bottom-0">
        <div className="container mx-auto max-w-4xl space-y-4">
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

          <p className="text-xs text-center text-muted-foreground">
            AI анализирует ваши транзакции и Health Score для формирования ответа.
          </p>
        </div>
      </div>
    </div>
  )
}