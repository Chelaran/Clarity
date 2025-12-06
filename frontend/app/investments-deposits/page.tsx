"use client"

import { Header } from "@/components/header"
import { InvestmentsList } from "@/components/investments-list"
import { DepositsList } from "@/components/deposits-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InvestmentsDepositsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Инвестиции и вклады</h1>
          <p className="text-muted-foreground mt-2">
            Управляйте своими инвестициями и банковскими вкладами
          </p>
        </div>

        <Tabs defaultValue="investments" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="investments">Инвестиции</TabsTrigger>
            <TabsTrigger value="deposits">Вклады</TabsTrigger>
          </TabsList>
          
          <TabsContent value="investments" className="mt-6">
            <InvestmentsList />
          </TabsContent>
          
          <TabsContent value="deposits" className="mt-6">
            <DepositsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

