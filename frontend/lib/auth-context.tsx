"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { apiUrl } from "./api"

// Типы данных, которые возвращает бэкенд
interface User {
  id: number
  email: string
  created_at: string
}

interface AuthResponse {
  token: string
  user: User
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Можно использовать для прелоадера

  // При загрузке проверяем, есть ли токен в localStorage (восстанавливаем сессию)
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(apiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) throw new Error("Ошибка авторизации")

      const data: AuthResponse = await res.json()
      saveSession(data)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(apiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        if (res.status === 409) throw new Error("Пользователь уже существует")
        throw new Error("Ошибка регистрации")
      }

      const data: AuthResponse = await res.json()
      saveSession(data)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  const saveSession = (data: AuthResponse) => {
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}