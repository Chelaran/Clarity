"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: string
  card?: {
    title: string
    value: string
    type: "warning" | "success" | "info"
  }
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Привет! Я ваш персональный финансовый помощник. Я проанализировал ваши траты за этот месяц.",
    timestamp: "10:30",
  },
  {
    id: "2",
    role: "assistant",
    content: "Внимание: Расходы на такси выросли на 25% по сравнению с прошлым месяцем.",
    timestamp: "10:30",
    card: {
      title: "ПРЕВЫШЕНИЕ БЮДЖЕТА",
      value: "+25%",
      type: "warning",
    },
  },
]

const quickActions = [
  { icon: TrendingUp, label: "Анализ трат" },
  { icon: PiggyBank, label: "Как сэкономить?" },
  { icon: TrendingDown, label: "Прогноз" },
  { icon: Lightbulb, label: "Куда вложить?" },
]

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Я анализирую ваш запрос и подготовлю детальный ответ...",
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const handleQuickAction = (label: string) => {
    setInput(label)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Chat Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">C</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-foreground">Финансовый Ассистент</h1>
                  <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">PRO</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">В сети</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">Отвечает мгновенно</span>
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Date Separator */}
          <div className="flex justify-center">
            <div className="text-sm text-muted-foreground bg-muted px-4 py-1.5 rounded-full">Сегодня, 24 Октября</div>
          </div>

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* Message Header */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-medium text-sm">C</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">Clarity AI</span>
                  <span className="text-sm text-muted-foreground">{message.timestamp}</span>
                </div>

                {/* Message Content */}
                <div className="ml-10">
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-4 max-w-2xl">
                    <p className="text-foreground leading-relaxed">{message.content}</p>

                    {/* Card if present */}
                    {message.card && (
                      <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-destructive mb-1">{message.card.title}</div>
                            <div className="text-2xl font-bold text-destructive">{message.card.value}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      <span className="text-xs">Копировать</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-border bg-card p-6">
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
                  className="text-muted-foreground hover:text-foreground hover:border-primary"
                >
                  <Icon className="w-4 h-4 mr-2" />
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
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Спросите о своих финансах..."
              className="w-full px-6 py-4 pr-14 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary hover:bg-primary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-center text-muted-foreground">
            AI может допустить ошибки. Проверяйте важную финансовую информацию.
          </p>
        </div>
      </div>
    </div>
  )
}
