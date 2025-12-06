"use client"

import { Header } from "@/components/header"
import { OperationsHeader } from "@/components/operations-header"
import { OperationsList } from "@/components/operations-list"

export default function OperationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        <OperationsHeader />
        <OperationsList />
      </main>
    </div>
  )
}
