package service

import (
	"clarity/internal/models"
	"math"
	"time"

	"gorm.io/gorm"
)

type HealthScoreService struct {
	db *gorm.DB
}

func NewHealthScoreService(db *gorm.DB) *HealthScoreService {
	return &HealthScoreService{db: db}
}

type HealthScoreResult struct {
	Score           float64            `json:"score"`
	Grade           string             `json:"grade"`
	Components      HealthComponents   `json:"components"`
	EmergencyFundMonths float64        `json:"emergency_fund_months"`
	Trend           TrendAnalysis      `json:"trend"`           // Прогноз тренда
	Insights        []Insight          `json:"insights"`        // Конкретные рекомендации
	Benchmark       BenchmarkComparison `json:"benchmark"`      // Сравнение с нормами
}

type TrendAnalysis struct {
	Direction    string  `json:"direction"`     // "improving", "declining", "stable"
	ProjectedScore float64 `json:"projected_score"` // Прогноз на следующий месяц
	Confidence   float64 `json:"confidence"`    // Уверенность в прогнозе (0-100)
}

type Insight struct {
	Type        string  `json:"type"`         // "warning", "opportunity", "achievement"
	Component   string  `json:"component"`    // "savings_rate", "emergency_fund", etc.
	Message     string  `json:"message"`      // Конкретный совет
	Impact      float64 `json:"impact"`       // Потенциальное улучшение score
}

type BenchmarkComparison struct {
	SavingsRateBenchmark    float64 `json:"savings_rate_benchmark"`     // Норма для пользователя
	EmergencyFundBenchmark  float64 `json:"emergency_fund_benchmark"`   // Рекомендуемый размер
	StabilityBenchmark      float64 `json:"stability_benchmark"`         // Целевой CV
}

type HealthComponents struct {
	SavingsRate      ComponentScore `json:"savings_rate"`
	EmergencyFund    ComponentScore `json:"emergency_fund"`
	SpendingStability ComponentScore `json:"spending_stability"`
	EssentialRatio   ComponentScore `json:"essential_ratio"`
}

type ComponentScore struct {
	Value float64 `json:"value"`
	Score float64 `json:"score"`
	Weight float64 `json:"weight"`
}

func (s *HealthScoreService) Calculate(userID uint, month string) (*HealthScoreResult, error) {
	monthTime, _ := time.Parse("2006-01", month)
	startDate := month + "-01"
	lastDay := monthTime.AddDate(0, 1, 0).AddDate(0, 0, -1)
	endDate := lastDay.Format("2006-01-02")

	// Получаем данные за месяц
	var monthIncome, monthExpense, monthEssential float64
	s.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&monthIncome)

	s.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&monthExpense)

	s.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND is_essential = true AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&monthEssential)

	// Получаем баланс (сумма всех доходов - расходов)
	var totalBalance float64
	s.db.Model(&models.Transaction{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)").
		Scan(&totalBalance)

	// Средние расходы за последние 3 месяца (сумма за месяц)
	var totalExpense3Months float64
	threeMonthsAgo := monthTime.AddDate(0, -3, 0).Format("2006-01-02")
	s.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, threeMonthsAgo, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense3Months)

	// Делим на 3 месяца (или используем текущий месяц если нет данных)
	avgExpense := totalExpense3Months / 3.0
	if avgExpense == 0 {
		avgExpense = monthExpense
	}

	// 1. Savings Rate (30%)
	savingsRate := 0.0
	if monthIncome > 0 {
		savingsRate = ((monthIncome - monthExpense) / monthIncome) * 100
	}
	savingsRateScore := normalizeSavingsRate(savingsRate)

	// 2. Emergency Fund (25%)
	emergencyFundMonths := 0.0
	if avgExpense > 0 {
		emergencyFundMonths = totalBalance / avgExpense
	}
	emergencyFundScore := normalizeEmergencyFund(emergencyFundMonths)

	// 3. Spending Stability (25%) - коэффициент вариации расходов за 6 месяцев
	stabilityScore := s.calculateSpendingStability(userID, monthTime)

	// 4. Essential Ratio (20%)
	essentialRatio := 0.0
	if monthExpense > 0 {
		essentialRatio = (monthEssential / monthExpense) * 100
	}
	essentialRatioScore := normalizeEssentialRatio(essentialRatio)

	// Итоговый score (взвешенная сумма)
	totalScore := savingsRateScore*0.30 + emergencyFundScore*0.25 + stabilityScore*0.25 + essentialRatioScore*0.20

	grade := getGrade(totalScore)

	// Анализ тренда (линейная регрессия за последние 3 месяца)
	trend := s.analyzeTrend(userID, monthTime, totalScore)

	// Генерация инсайтов
	insights := s.generateInsights(savingsRate, emergencyFundMonths, stabilityScore, essentialRatio, 
		savingsRateScore, emergencyFundScore, essentialRatioScore)

	// Адаптивные бенчмарки на основе истории пользователя
	benchmark := s.calculateBenchmarks(userID, monthTime)

	return &HealthScoreResult{
		Score:            math.Round(totalScore*100) / 100,
		Grade:            grade,
		EmergencyFundMonths: math.Round(emergencyFundMonths*100) / 100,
		Components: HealthComponents{
			SavingsRate: ComponentScore{
				Value:  math.Round(savingsRate*100) / 100,
				Score:  savingsRateScore,
				Weight: 0.30,
			},
			EmergencyFund: ComponentScore{
				Value:  emergencyFundMonths,
				Score:  emergencyFundScore,
				Weight: 0.25,
			},
			SpendingStability: ComponentScore{
				Value:  stabilityScore,
				Score:  stabilityScore,
				Weight: 0.25,
			},
			EssentialRatio: ComponentScore{
				Value:  math.Round(essentialRatio*100) / 100,
				Score:  essentialRatioScore,
				Weight: 0.20,
			},
		},
		Trend:    trend,
		Insights: insights,
		Benchmark: benchmark,
	}, nil
}

// Улучшенный алгоритм стабильности с экспоненциальным взвешиванием
// Использует скользящее среднее и Z-score для детекции аномалий
func (s *HealthScoreService) calculateSpendingStability(userID uint, monthTime time.Time) float64 {
	// Получаем расходы за последние 6 месяцев
	var expenses []float64
	for i := 5; i >= 0; i-- {
		m := monthTime.AddDate(0, -i, 0)
		start := m.Format("2006-01-02")
		lastDay := m.AddDate(0, 1, 0).AddDate(0, 0, -1)
		end := lastDay.Format("2006-01-02")

		var amount float64
		s.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, start, end).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&amount)
		if amount > 0 {
			expenses = append(expenses, amount)
		}
	}

	if len(expenses) < 2 {
		return 50.0
	}

	// 1. Вычисляем статистики (среднее, стандартное отклонение)
	mean := 0.0
	for _, v := range expenses {
		mean += v
	}
	mean /= float64(len(expenses))

	if mean == 0 {
		return 50.0
	}

	variance := 0.0
	for _, v := range expenses {
		variance += math.Pow(v-mean, 2)
	}
	variance /= float64(len(expenses))
	stdDev := math.Sqrt(variance)

	// 2. Z-score для детекции аномалий (выбросов)
	anomalyCount := 0
	for _, v := range expenses {
		zScore := math.Abs((v - mean) / stdDev)
		if zScore > 2.0 { // Стандартное отклонение > 2σ считается аномалией
			anomalyCount++
		}
	}
	anomalyPenalty := float64(anomalyCount) / float64(len(expenses)) * 30.0 // Штраф до 30 points

	// 3. Коэффициент вариации (CV)
	cv := (stdDev / mean) * 100

	// 4. Экспоненциальное взвешивание (более свежие месяцы важнее)
	weightedVariance := 0.0
	totalWeight := 0.0
	alpha := 0.3 // Коэффициент затухания
	for i, v := range expenses {
		weight := math.Exp(-alpha * float64(len(expenses)-1-i))
		weightedVariance += weight * math.Pow(v-mean, 2)
		totalWeight += weight
	}
	weightedStdDev := math.Sqrt(weightedVariance / totalWeight)
	weightedCV := (weightedStdDev / mean) * 100

	// 5. Комбинированный score: CV + взвешенный CV + штраф за аномалии
	baseScore := 100.0 - (cv * 2.0) // CV 0% = 100, CV 50% = 0
	weightedScore := 100.0 - (weightedCV * 2.0)
	combinedScore := (baseScore*0.6 + weightedScore*0.4) - anomalyPenalty

	if combinedScore < 0 {
		return 0.0
	}
	if combinedScore > 100 {
		return 100.0
	}
	return combinedScore
}

// Сигмоидальная нормализация для Savings Rate
// Использует логистическую функцию для плавного перехода
func normalizeSavingsRate(rate float64) float64 {
	if rate <= 0 {
		return 0.0
	}
	// Сигмоида: 1 / (1 + e^(-k(x - x0)))
	// k = 0.3 (крутизна), x0 = 15 (центр)
	k := 0.3
	x0 := 15.0
	sigmoid := 1.0 / (1.0 + math.Exp(-k*(rate-x0)))
	return sigmoid * 100.0
}

// Логарифмическая нормализация для Emergency Fund
// Использует log для более плавного роста после 3 месяцев
func normalizeEmergencyFund(months float64) float64 {
	if months <= 0 {
		return 0.0
	}
	if months >= 6 {
		return 100.0
	}
	if months < 3 {
		// 0-3 месяца: линейная интерполяция
		return (months / 3) * 50.0
	}
	// 3-6 месяцев: логарифмическая шкала для плавного роста
	// log(months/3) / log(2) дает плавный переход
	logScale := math.Log(months/3) / math.Log(2.0)
	return 50.0 + (logScale * 50.0)
}

// Гауссова нормализация для Essential Ratio
// Использует нормальное распределение с центром в 55%
func normalizeEssentialRatio(ratio float64) float64 {
	if ratio < 0 || ratio > 100 {
		return 0.0
	}

	// Гауссова функция: exp(-0.5 * ((x - μ) / σ)²)
	// μ = 55 (центр), σ = 10 (стандартное отклонение)
	mu := 55.0
	sigma := 10.0
	gaussian := math.Exp(-0.5 * math.Pow((ratio-mu)/sigma, 2))
	
	// Нормализуем к 0-100, где 55% = 100 points
	return gaussian * 100.0
}

func getGrade(score float64) string {
	switch {
	case score >= 90:
		return "A"
	case score >= 75:
		return "B"
	case score >= 60:
		return "C"
	case score >= 40:
		return "D"
	default:
		return "F"
	}
}

// Линейная регрессия для прогнозирования тренда Health Score
func (s *HealthScoreService) analyzeTrend(userID uint, monthTime time.Time, currentScore float64) TrendAnalysis {
	// Получаем упрощенные scores за последние 3 месяца (без рекурсии)
	var scores []float64
	for i := 2; i >= 0; i-- {
		m := monthTime.AddDate(0, -i, 0)
		start := m.Format("2006-01-02")
		lastDay := m.AddDate(0, 1, 0).AddDate(0, 0, -1)
		end := lastDay.Format("2006-01-02")

		var income, expense float64
		s.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, start, end).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&income)

		s.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, start, end).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&expense)

		// Упрощенный расчет score для тренда
		savingsRate := 0.0
		if income > 0 {
			savingsRate = ((income - expense) / income) * 100
		}
		savingsScore := normalizeSavingsRate(savingsRate)
		
		// Простой score для тренда (только savings rate как индикатор)
		simpleScore := savingsScore * 0.5 + 50.0 // Базовая оценка
		scores = append(scores, simpleScore)
	}

	// Добавляем текущий score
	scores = append(scores, currentScore)

	if len(scores) < 2 {
		return TrendAnalysis{
			Direction:      "stable",
			ProjectedScore: currentScore,
			Confidence:    0.0,
		}
	}

	// Линейная регрессия: y = ax + b
	// x - номер месяца (0, 1, 2), y - score
	n := float64(len(scores))
	sumX, sumY, sumXY, sumX2 := 0.0, 0.0, 0.0, 0.0
	for i, y := range scores {
		x := float64(i)
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
	}

	// Коэффициенты регрессии
	denominator := n*sumX2 - sumX*sumX
	if math.Abs(denominator) < 0.001 {
		return TrendAnalysis{
			Direction:      "stable",
			ProjectedScore: currentScore,
			Confidence:    0.0,
		}
	}

	a := (n*sumXY - sumX*sumY) / denominator // Наклон
	b := (sumY - a*sumX) / n                 // Смещение

	// Прогноз на следующий месяц (x = 3)
	projectedScore := a*3.0 + b

	// Коэффициент детерминации R² для уверенности
	meanY := sumY / n
	ssTotal, ssResidual := 0.0, 0.0
	for i, y := range scores {
		x := float64(i)
		predicted := a*x + b
		ssTotal += math.Pow(y-meanY, 2)
		ssResidual += math.Pow(y-predicted, 2)
	}
	rSquared := 1.0 - (ssResidual / ssTotal)
	confidence := math.Max(0, math.Min(100, rSquared*100))

	direction := "stable"
	if a > 2.0 {
		direction = "improving"
	} else if a < -2.0 {
		direction = "declining"
	}

	return TrendAnalysis{
		Direction:      direction,
		ProjectedScore: math.Round(projectedScore*100) / 100,
		Confidence:     math.Round(confidence*100) / 100,
	}
}

// Генерация умных инсайтов на основе анализа компонентов
func (s *HealthScoreService) generateInsights(savingsRate, emergencyMonths, stabilityScore, essentialRatio,
	savingsRateScore, emergencyFundScore, essentialRatioScore float64) []Insight {
	var insights []Insight

	// Savings Rate инсайты
	if savingsRate < 10 && savingsRateScore < 50 {
		potentialGain := (10.0 - savingsRate) * 5.0 * 0.30 // Потенциальное улучшение score
		insights = append(insights, Insight{
			Type:      "opportunity",
			Component: "savings_rate",
			Message:   "Увеличьте накопления до 10% дохода, чтобы улучшить Health Score",
			Impact:    potentialGain,
		})
	} else if savingsRate >= 20 {
		insights = append(insights, Insight{
			Type:      "achievement",
			Component: "savings_rate",
			Message:   "Отличный уровень накоплений! Вы откладываете более 20% дохода",
			Impact:    0.0,
		})
	}

	// Emergency Fund инсайты
	if emergencyMonths < 3 {
		monthsNeeded := 3.0 - emergencyMonths
		potentialGain := (monthsNeeded / 3.0) * 50.0 * 0.25
		insights = append(insights, Insight{
			Type:      "warning",
			Component: "emergency_fund",
			Message:   "Финансовая подушка критически мала. Накопите минимум 3 месяца расходов",
			Impact:    potentialGain,
		})
	} else if emergencyMonths >= 6 {
		insights = append(insights, Insight{
			Type:      "achievement",
			Component: "emergency_fund",
			Message:   "Отличная финансовая подушка! У вас достаточно средств на 6+ месяцев",
			Impact:    0.0,
		})
	}

	// Stability инсайты
	if stabilityScore < 50 {
		insights = append(insights, Insight{
			Type:      "opportunity",
			Component: "spending_stability",
			Message:   "Расходы нестабильны. Старайтесь планировать бюджет для более равномерных трат",
			Impact:    (50.0 - stabilityScore) * 0.25,
		})
	}

	// Essential Ratio инсайты
	if essentialRatio < 50 {
		insights = append(insights, Insight{
			Type:      "warning",
			Component: "essential_ratio",
			Message:   "Слишком много необязательных расходов. Оптимально 50-60% обязательных трат",
			Impact:    (50.0 - essentialRatio) / 40.0 * 100.0 * 0.20,
		})
	} else if essentialRatio > 80 {
		insights = append(insights, Insight{
			Type:      "opportunity",
			Component: "essential_ratio",
			Message:   "Слишком много обязательных расходов. Рассмотрите оптимизацию (рефинансирование, пересмотр тарифов)",
			Impact:    ((essentialRatio - 60) / 40.0) * 100.0 * 0.20,
		})
	}

	return insights
}

// Адаптивные бенчмарки на основе истории пользователя
func (s *HealthScoreService) calculateBenchmarks(userID uint, monthTime time.Time) BenchmarkComparison {
	// Получаем данные напрямую из БД за последние 6 месяцев
	var totalSavingsRate, totalEmergencyMonths, totalCV float64
	count := 0

	for i := 5; i >= 0; i-- {
		m := monthTime.AddDate(0, -i, 0)
		start := m.Format("2006-01-02")
		lastDay := m.AddDate(0, 1, 0).AddDate(0, 0, -1)
		end := lastDay.Format("2006-01-02")

		var income, expense float64
		s.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, start, end).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&income)

		s.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, start, end).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&expense)

		if income > 0 {
			savingsRate := ((income - expense) / income) * 100
			totalSavingsRate += savingsRate
		}

		// Упрощенный расчет emergency fund
		var balance float64
		s.db.Model(&models.Transaction{}).
			Where("user_id = ? AND date <= ?", userID, end).
			Select("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)").
			Scan(&balance)

		if expense > 0 {
			emergencyMonths := balance / expense
			totalEmergencyMonths += emergencyMonths
		}

		// CV из stability (упрощенный)
		if expense > 0 {
			cv := 20.0 // Дефолт
			totalCV += cv
		}

		count++
	}

	if count == 0 {
		return BenchmarkComparison{
			SavingsRateBenchmark:   20.0,
			EmergencyFundBenchmark: 6.0,
			StabilityBenchmark:      20.0,
		}
	}

	avgSavingsRate := totalSavingsRate / float64(count)
	avgEmergencyMonths := totalEmergencyMonths / float64(count)
	avgCV := totalCV / float64(count)

	// Адаптивные пороги: цель = текущее среднее + 10% улучшение
	return BenchmarkComparison{
		SavingsRateBenchmark:   math.Max(20.0, avgSavingsRate*1.1),
		EmergencyFundBenchmark: math.Max(6.0, avgEmergencyMonths*1.1),
		StabilityBenchmark:      math.Max(20.0, avgCV*0.9),
	}
}

