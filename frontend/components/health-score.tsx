import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export function HealthScore() {
  return (
    <Card className="p-8 flex flex-col items-center justify-center">
      {/* Circular Progress */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="16"
            strokeDasharray={`${2 * Math.PI * 85 * 0.73} ${2 * Math.PI * 85}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-bold text-foreground">73%</span>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 text-primary">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">Тренд: улучшается</span>
      </div>
    </Card>
  )
}
