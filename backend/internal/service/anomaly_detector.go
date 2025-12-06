package service

import (
	"clarity/internal/models"
	"math"
	"time"

	"gorm.io/gorm"
)

type AnomalyDetector struct {
	db *gorm.DB
}

func NewAnomalyDetector(db *gorm.DB) *AnomalyDetector {
	return &AnomalyDetector{db: db}
}

// AnomalyResult - результат детекции аномалий
type AnomalyResult struct {
	IsAnomaly   bool
	Reason      string
	Severity    string // "low", "medium", "high"
	ZScore      float64
	CategoryAvg float64
}

// DetectTransactionAnomaly - детекция аномалий в отдельной транзакции
func (a *AnomalyDetector) DetectTransactionAnomaly(userID uint, tx *models.Transaction) *AnomalyResult {
	result := &AnomalyResult{IsAnomaly: false}

	// Проверяем только расходы
	if tx.Type != "expense" {
		return result
	}

	// 1. Проверка суммы относительно истории по категории
	if tx.Category != "" {
		var categoryTransactions []models.Transaction
		a.db.Where("user_id = ? AND type = 'expense' AND category = ? AND id != ?", userID, tx.Category, tx.ID).
			Order("date desc").
			Limit(30).
			Find(&categoryTransactions)

		if len(categoryTransactions) >= 3 {
			// Вычисляем статистики по категории
			var amounts []float64
			for _, ct := range categoryTransactions {
				amounts = append(amounts, math.Abs(ct.Amount))
			}

			mean := 0.0
			for _, v := range amounts {
				mean += v
			}
			mean /= float64(len(amounts))

			variance := 0.0
			for _, v := range amounts {
				variance += math.Pow(v-mean, 2)
			}
			variance /= float64(len(amounts))
			stdDev := math.Sqrt(variance)

			if stdDev > 0 && mean > 0 {
				amountAbs := math.Abs(tx.Amount)
				zScore := math.Abs((amountAbs - mean) / stdDev)
				result.ZScore = zScore
				result.CategoryAvg = mean

				// Z-score > 2.5 = аномалия
				if zScore > 2.5 {
					result.IsAnomaly = true
					result.Reason = "Сумма транзакции значительно превышает среднюю для категории"
					if zScore > 4.0 {
						result.Severity = "high"
					} else if zScore > 3.0 {
						result.Severity = "medium"
					} else {
						result.Severity = "low"
					}
					return result
				}
			}
		}
	}

	// 2. Проверка времени транзакции (ночные операции)
	hour := tx.Date.Hour()
	if hour >= 0 && hour < 6 {
		// Проверяем, есть ли история ночных транзакций
		var nightTransactions int64
		a.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense' AND EXTRACT(HOUR FROM date) >= 0 AND EXTRACT(HOUR FROM date) < 6", userID).
			Count(&nightTransactions)

		// Если ночных транзакций меньше 5% от всех, это аномалия
		var totalTransactions int64
		a.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense'", userID).
			Count(&totalTransactions)

		if totalTransactions > 20 && nightTransactions < int64(float64(totalTransactions)*0.05) {
			amountAbs := math.Abs(tx.Amount)
			// Если сумма больше 1000₽, это подозрительно
			if amountAbs > 1000 {
				result.IsAnomaly = true
				result.Reason = "Необычно большая транзакция в ночное время"
				result.Severity = "medium"
				return result
			}
		}
	}

	// 3. Проверка необычно больших сумм (абсолютный порог)
	amountAbs := math.Abs(tx.Amount)
	if amountAbs > 50000 {
		// Проверяем, были ли такие большие транзакции раньше
		var largeTransactions int64
		a.db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense' AND ABS(amount) > 50000", userID).
			Count(&largeTransactions)

		if largeTransactions < 3 {
			result.IsAnomaly = true
			result.Reason = "Необычно большая сумма транзакции"
			result.Severity = "high"
			return result
		}
	}

	return result
}

// CheckCategoryLimit - проверка приближения к лимиту по категории
func (a *AnomalyDetector) CheckCategoryLimit(userID uint, category string, amount float64, month string) (bool, float64, float64) {
	// Получаем расходы по категории за текущий месяц
	monthTime, _ := time.Parse("2006-01", month)
	startDate := month + "-01"
	lastDay := monthTime.AddDate(0, 1, 0).AddDate(0, 0, -1)
	endDate := lastDay.Format("2006-01-02")

	var monthExpense float64
	a.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND category = ? AND date >= ? AND date <= ?", userID, category, startDate, endDate).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&monthExpense)

	// Получаем средний месячный расход по категории за последние 3 месяца
	var totalExpense3Months float64
	threeMonthsAgo := monthTime.AddDate(0, -3, 0).Format("2006-01-02")
	a.db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND category = ? AND date >= ? AND date <= ?", userID, category, threeMonthsAgo, endDate).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&totalExpense3Months)

	avgExpense := totalExpense3Months / 3.0
	if avgExpense == 0 {
		// Если нет истории, используем текущий месяц как базу
		avgExpense = monthExpense
	}

	// Если средний расход > 0, используем его как лимит
	limit := avgExpense * 1.2 // Лимит = 120% от среднего
	if limit == 0 {
		return false, 0, 0
	}

	// Проверяем, превысили ли лимит после добавления новой транзакции
	newTotal := monthExpense + amount
	if newTotal > limit {
		return true, newTotal, limit
	}

	return false, newTotal, limit
}

// CheckCushionDecrease - проверка снижения финансовой подушки
func (a *AnomalyDetector) CheckCushionDecrease(userID uint, currentBalance float64) (bool, float64, float64) {
	// Получаем баланс за предыдущий месяц
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)
	lastDay := lastMonth.AddDate(0, 1, 0).AddDate(0, 0, -1)
	endDate := lastDay.Format("2006-01-02")

	var lastMonthBalance float64
	a.db.Model(&models.Transaction{}).
		Where("user_id = ? AND date <= ?", userID, endDate).
		Select("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)").
		Scan(&lastMonthBalance)

	// Если баланс снизился более чем на 20%
	if lastMonthBalance > 0 && currentBalance < lastMonthBalance*0.8 {
		return true, currentBalance, lastMonthBalance
	}

	return false, currentBalance, lastMonthBalance
}
