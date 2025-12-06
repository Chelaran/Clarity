"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Logo } from "@/components/logo"

export function AuthPage() {
  const { login, register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err: any) {
      setError(err.message || "Произошла ошибка")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Левая часть - минималистичный фон */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
        {/* Простой геометрический элемент */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-200/50 dark:bg-slate-700/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/50 dark:bg-slate-700/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Контент левой части */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <Logo className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-light text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
              Clarity
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-md">
              Управляйте финансами с ясностью и уверенностью
            </p>
          </motion.div>
        </div>
      </div>

      {/* Правая часть - форма */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Заголовок для мобильных */}
          <div className="lg:hidden mb-12">
            <div className="mb-6">
              <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-light text-slate-900 dark:text-slate-100 mb-2">Clarity</h1>
            <p className="text-slate-600 dark:text-slate-400">Управляйте финансами с ясностью</p>
          </div>

          {/* Переключатель */}
          <div className="flex gap-1 mb-8 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setError(null)
              }}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isLogin
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setError(null)
              }}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                !isLogin
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600 bg-white dark:bg-slate-900"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isLogin ? "Введите пароль" : "Минимум 6 символов"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? undefined : 6}
                className="h-11 border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600 bg-white dark:bg-slate-900"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Вход..." : "Регистрация..."}
                </>
              ) : (
                isLogin ? "Войти" : "Зарегистрироваться"
              )}
            </Button>
          </form>

          {/* Дополнительная информация */}
          <p className="mt-8 text-xs text-slate-500 dark:text-slate-500 text-center">
            {isLogin ? (
              <>Нет аккаунта? <button onClick={() => setIsLogin(false)} className="text-slate-900 dark:text-slate-100 hover:underline font-medium">Зарегистрируйтесь</button></>
            ) : (
              <>Уже есть аккаунт? <button onClick={() => setIsLogin(true)} className="text-slate-900 dark:text-slate-100 hover:underline font-medium">Войдите</button></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
