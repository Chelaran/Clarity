import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HealthScore } from "@/components/health-score"
import { HealthRecommendations } from "@/components/health-recommendations"
import { HealthCategories } from "@/components/health-categories"

export default function FinancialHealthPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <Link href="/analytics">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Финансовое Здоровье</h1>
              <p className="text-muted-foreground">Комплексная оценка вашего состояния</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[400px,1fr] gap-6 mb-8">
          {/* Score Card */}
          <HealthScore />

          {/* Recommendations */}
          <HealthRecommendations />
        </div>

        {/* Categories */}
        <HealthCategories />
      </div>
    </div>
  )
}
