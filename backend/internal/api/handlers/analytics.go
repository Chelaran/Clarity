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
	Month           string             `json:"month"`
	TotalIncome     float64            `json:"total_income"`
	TotalExpense    float64            `json:"total_expense"`
	Balance         float64            `json:"balance"`
	SavingsRate     float64            `json:"savings_rate"`
	ByCategory      map[string]float64 `json:"by_category"`
	EssentialExpense float64            `json:"essential_expense"`
	NonEssentialExpense float64        `json:"non_essential_expense"`
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

	// Расходы
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense)

	// Обязательные расходы
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND is_essential = true AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&essentialExpense)

	nonEssentialExpense := totalExpense - essentialExpense

	// По категориям
	var categoryData []struct {
		Category string
		Amount   float64
	}
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("category, COALESCE(SUM(amount), 0) as amount").
		Group("category").
		Find(&categoryData)

	byCategory := make(map[string]float64)
	for _, item := range categoryData {
		byCategory[item.Category] = item.Amount
	}

	balance := totalIncome - totalExpense
	savingsRate := 0.0
	if totalIncome > 0 {
		savingsRate = (balance / totalIncome) * 100
	}

	c.JSON(http.StatusOK, SummaryResponse{
		Month:            month,
		TotalIncome:      totalIncome,
		TotalExpense:     totalExpense,
		Balance:          balance,
		SavingsRate:      savingsRate,
		ByCategory:       byCategory,
		EssentialExpense: essentialExpense,
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
			Select("COALESCE(SUM(amount), 0)").
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

