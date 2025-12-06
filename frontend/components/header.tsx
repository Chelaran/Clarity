"use client"

import { Search, Bell, Plus, Menu, X, LogIn, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { AddOperationModal } from "@/components/add-operation-modal"
import { AuthModal } from "@/components/auth-modal" // Импортируем нашу новую модалку
import { useAuth } from "@/lib/auth-context" // Импортируем хук авторизации

export function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth() // Получаем пользователя и функцию логаута

  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Обзор", icon: "📊" },
    { href: "/operations", label: "Операции", icon: "📋" },
    { href: "/investments-deposits", label: "Инвестиции", icon: "💰" },
    { href: "/ai-assistant", label: "AI-помощник", icon: "✨" },
    { href: "/analytics", label: "Аналитика", icon: null },
  ]

  return (
    <>
      <header className="border-b border-border bg-card relative z-50">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="flex items-center justify-between h-16">
            
            {/* 1. Логотип и меню */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2 text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>

              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-semibold text-foreground hidden sm:block">Clarity</span>
              </Link>
            </div>

            {/* 2. Навигация (Только если пользователь авторизован, хотя можно показывать и гостям, если страницы публичные) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"}
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* 3. Действия */}
            <div className="flex items-center gap-1 sm:gap-2">
              
              {/* Показываем поиск и уведомления только авторизованным */}
              {user && (
                <>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Search className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                  </Button>
                </>
              )}

              {/* ЛОГИКА КНОПОК */}
              {user ? (
                // ЕСЛИ АВТОРИЗОВАН
                <>
                  {/* Кнопка добавления операции */}
                  <Button
                    onClick={() => setIsOperationModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4"
                  >
                    <Plus className="w-5 h-5 sm:mr-2 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Операция</span>
                  </Button>
                  
                  {/* Кнопка Выхода (для десктопа можно иконку с аватаркой, но пока так) */}
                  <Button variant="ghost" size="icon" onClick={logout} title="Выйти">
                     <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>
                </>
              ) : (
                // ЕСЛИ НЕ АВТОРИЗОВАН (ГОСТЬ)
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-primary text-primary-foreground"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Мобильное меню */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-card border-b border-border p-4 flex flex-col gap-2 md:hidden shadow-lg animate-in slide-in-from-top-2">
            {user ? (
              // Меню для пользователя
              <>
                <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border mb-2">
                  {user.email}
                </div>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start ${pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                      {item.icon && <span className="mr-3 text-lg">{item.icon}</span>}
                      <span className="text-base">{item.label}</span>
                    </Button>
                  </Link>
                ))}
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="mr-3 w-5 h-5" />
                  Выйти
                </Button>
              </>
            ) : (
              // Меню для гостя
              <Button className="w-full" onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}>
                <LogIn className="mr-2 w-4 h-4" />
                Войти в аккаунт
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Модалки */}
      <AddOperationModal open={isOperationModalOpen} onOpenChange={setIsOperationModalOpen} />
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </>
  )
}