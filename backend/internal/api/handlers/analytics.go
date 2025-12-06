package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/models"
	"clarity/internal/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	repo *repository.Repository
}

func NewAnalyticsHandler(repo *repository.Repository) *AnalyticsHandler {
	return &AnalyticsHandler{repo: repo}
}

type SummaryResponse struct {
	Month               string             `json:"month"`
	TotalIncome         float64            `json:"total_income"`
	TotalExpense        float64            `json:"total_expense"`
	Balance             float64            `json:"balance"`             // Баланс за месяц
	TotalBalance        float64            `json:"total_balance"`      // Общий баланс (сумма всех транзакций)
	SavingsRate         float64            `json:"savings_rate"`
	ByCategory          map[string]float64 `json:"by_category"`
	EssentialExpense    float64            `json:"essential_expense"`
	NonEssentialExpense float64            `json:"non_essential_expense"`
}

type TrendData struct {
	Month   string  `json:"month"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
	Balance float64 `json:"balance"`
}

type TrendsResponse struct {
	Months []TrendData `json:"months"`
}

func (h *AnalyticsHandler) Summary(c *gin.Context) {
	userID := middleware.GetUserID(c)
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	startDate := month + "-01"
	// Получаем последний день месяца
	monthTime, _ := time.Parse("2006-01", month)
	lastDay := monthTime.AddDate(0, 1, 0).AddDate(0, 0, -1)
	endDate := lastDay.Format("2006-01-02")

	db := h.repo.DB()

	var totalIncome, totalExpense, essentialExpense float64

	// Доходы
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalIncome)

	// Расходы (amount уже отрицательный, берем абсолютное значение для отображения)
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&totalExpense)

	// Обязательные расходы (amount уже отрицательный, берем абсолютное значение)
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND is_essential = true AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&essentialExpense)

	nonEssentialExpense := totalExpense - essentialExpense

	// По категориям
	var categoryData []struct {
		Category string
		Amount   float64
	}
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("category, COALESCE(SUM(ABS(amount)), 0) as amount").
		Group("category").
		Find(&categoryData)

	byCategory := make(map[string]float64)
	for _, item := range categoryData {
		byCategory[item.Category] = item.Amount
	}

	// balance = доходы - расходы (расходы уже положительные после ABS)
	balance := totalIncome - totalExpense
	savingsRate := 0.0
	if totalIncome > 0 {
		savingsRate = (balance / totalIncome) * 100
	}

	// Общий баланс (сумма всех транзакций за все время)
	// Расходы хранятся как отрицательные числа (-350), доходы - положительные (3506)
	// Поэтому просто суммируем все amount: 3506 + (-350) = 3156
	var totalBalance float64
	db.Model(&models.Transaction{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalBalance)

	c.JSON(http.StatusOK, SummaryResponse{
		Month:               month,
		TotalIncome:         totalIncome,
		TotalExpense:        totalExpense,
		Balance:             balance,
		TotalBalance:        totalBalance,
		SavingsRate:         savingsRate,
		ByCategory:          byCategory,
		EssentialExpense:    essentialExpense,
		NonEssentialExpense: nonEssentialExpense,
	})
}

func (h *AnalyticsHandler) Trends(c *gin.Context) {
	userID := middleware.GetUserID(c)
	monthsCount := 6
	if m := c.Query("months"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil {
			monthsCount = parsed
			if monthsCount < 1 {
				monthsCount = 1
			}
			if monthsCount > 24 {
				monthsCount = 24
			}
		}
	}

	var trends []TrendData
	now := time.Now()

	db := h.repo.DB()

	for i := monthsCount - 1; i >= 0; i-- {
		monthDate := now.AddDate(0, -i, 0)
		month := monthDate.Format("2006-01")
		startDate := month + "-01"
		lastDay := monthDate.AddDate(0, 1, 0).AddDate(0, 0, -1)
		endDate := lastDay.Format("2006-01-02")

		var income, expense float64

		db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, startDate, endDate).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&income)

		db.Model(&models.Transaction{}).
			Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
			Select("COALESCE(SUM(ABS(amount)), 0)").
			Scan(&expense)

		trends = append(trends, TrendData{
			Month:   month,
			Income:  income,
			Expense: expense,
			Balance: income - expense,
		})
	}

	c.JSON(http.StatusOK, TrendsResponse{Months: trends})
}

// CategoryDistributionResponse - ответ с распределением по категориям в процентах
type CategoryDistributionResponse struct {
	Month        string             `json:"month"`
	TotalExpense float64            `json:"total_expense"` // Общая сумма расходов
	Distribution map[string]float64  `json:"distribution"`  // Категория -> процент (0-100)
}

// CategoryDistribution - возвращает распределение расходов по категориям в процентах для круговой диаграммы
func (h *AnalyticsHandler) CategoryDistribution(c *gin.Context) {
	userID := middleware.GetUserID(c)
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	startDate := month + "-01"
	monthTime, _ := time.Parse("2006-01", month)
	lastDay := monthTime.AddDate(0, 1, 0).AddDate(0, 0, -1)
	endDate := lastDay.Format("2006-01-02")

	db := h.repo.DB()

	// Получаем общую сумму расходов за месяц
	var totalExpense float64
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&totalExpense)

	// Если нет расходов, возвращаем пустое распределение
	if totalExpense == 0 {
		c.JSON(http.StatusOK, CategoryDistributionResponse{
			Month:        month,
			TotalExpense: 0,
			Distribution: make(map[string]float64),
		})
		return
	}

	// Получаем суммы по категориям
	var categoryData []struct {
		Category string
		Amount   float64
	}
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("category, COALESCE(SUM(ABS(amount)), 0) as amount").
		Group("category").
		Find(&categoryData)

	// Вычисляем проценты
	distribution := make(map[string]float64)
	var totalPercentage float64
	
	for _, item := range categoryData {
		if item.Category == "" {
			item.Category = "Другое"
		}
		percentage := (item.Amount / totalExpense) * 100
		distribution[item.Category] = percentage
		totalPercentage += percentage
	}

	// Нормализация: если сумма не равна 100 (из-за округления), корректируем
	// Находим категорию с максимальным процентом и корректируем её
	if len(distribution) > 0 && totalPercentage != 100.0 {
		diff := 100.0 - totalPercentage
		// Находим категорию с максимальным процентом
		maxCategory := ""
		maxValue := 0.0
		for cat, val := range distribution {
			if val > maxValue {
				maxValue = val
				maxCategory = cat
			}
		}
		// Корректируем самую большую категорию
		if maxCategory != "" {
			distribution[maxCategory] += diff
		}
	}

	c.JSON(http.StatusOK, CategoryDistributionResponse{
		Month:        month,
		TotalExpense: totalExpense,
		Distribution: distribution,
	})
}
