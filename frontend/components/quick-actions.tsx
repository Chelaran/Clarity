import { Card } from "@/components/ui/card"
import { Plus, Target, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <Card className="p-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">БЫСТРЫЕ ДЕЙСТВИЯ</p>

      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
          <Plus className="w-4 h-4 mr-3 text-muted-foreground" />
          Добавить операцию
        </Button>

        <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
          <Target className="w-4 h-4 mr-3 text-muted-foreground" />
          Создать цель
        </Button>

        <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
          <Download className="w-4 h-4 mr-3 text-muted-foreground" />
          Импорт данных
        </Button>
      </div>
    </Card>
  )
}
