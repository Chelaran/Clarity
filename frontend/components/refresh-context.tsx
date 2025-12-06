"use client"

import React, { createContext, useContext, useState } from "react"

// Создаем контекст
const RefreshContext = createContext({
  refreshIndex: 0,
  triggerRefresh: () => {},
})

// Хук для использования в компонентах
export const useRefresh = () => useContext(RefreshContext)

// Провайдер, который обернет приложение
export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshIndex, setRefreshIndex] = useState(0)

  const triggerRefresh = () => {
    // Просто увеличиваем число, чтобы useEffect сработал снова
    setRefreshIndex((prev) => prev + 1)
  }

  return (
    <RefreshContext.Provider value={{ refreshIndex, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}