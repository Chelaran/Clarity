"use client"

import { Calendar, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnalyticsHeader() {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      {/* 1. ЗАГОЛОВОК
          shrink-0 запрещает заголовку сжиматься, если кнопки начнут давить
      */}
      <h1 className="text-2xl sm:text-3xl font-bold shrink-0">Аналитика</h1>

      {/* 2. КОНТЕЙНЕР КНОПОК 
          flex-wrap: Ключевое свойство! Если ширины экрана не хватает, 
          кнопки аккуратно перейдут на следующую строку, а не полезут друг на друга.
          justify-end: На больших экранах прижимает всё вправо.
      */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:justify-end w-full md:w-auto">
        
        {/* ГРУППА 1: Переключатель периодов (Месяц/Квартал/Год) */}
        <div className="bg-card border border-border rounded-lg p-1 flex w-full sm:w-auto shrink-0">
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">
            Месяц
          </Button>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-muted-foreground flex-1 sm:flex-none">
            Квартал
          </Button>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-muted-foreground flex-1 sm:flex-none">
            Год
          </Button>
        </div>

        {/* ГРУППА 2: Кнопки действий 
            Сделали отдельный flex-контейнер для них, чтобы они держались вместе
            flex-wrap: разрешает перенос внутри этой группы тоже
        */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 bg-transparent flex-1 sm:flex-none justify-center shrink-0">
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">Окт 2023</span>
          </Button>

          <Button variant="outline" className="gap-2 bg-transparent flex-1 sm:flex-none justify-center shrink-0">
            <Download className="w-4 h-4" />
            Экспорт
          </Button>

          <Button className="gap-2 bg-[#1a1f2e] hover:bg-[#1a1f2e]/90 text-white flex-1 sm:flex-none justify-center shrink-0 min-w-[140px]">
            <FileText className="w-4 h-4" />
            <span className="whitespace-nowrap">Сохранить отчет</span>
          </Button>
        </div>
        
      </div>
    </div>
  )
}