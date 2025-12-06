"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { login, register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (type: "login" | "register") => {
    setError(null)
    setIsLoading(true)

    try {
      if (type === "login") {
        await login(email, password)
      } else {
        await register(email, password)
      }
      // Успех - закрываем модалку и очищаем поля
      onOpenChange(false)
      setEmail("")
      setPassword("")
    } catch (err: any) {
      setError(err.message || "Произошла ошибка")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Добро пожаловать</DialogTitle>
          <DialogDescription className="text-center">
            Войдите в систему или создайте аккаунт
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          {/* ВХОД */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button className="w-full mt-4" onClick={() => handleSubmit("login")} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Войти
            </Button>
          </TabsContent>

          {/* РЕГИСТРАЦИЯ */}
          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Пароль (мин. 6 символов)</Label>
              <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button className="w-full mt-4" onClick={() => handleSubmit("register")} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Зарегистрироваться
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}