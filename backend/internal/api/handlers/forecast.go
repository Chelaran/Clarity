package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/repository"
	"clarity/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ForecastHandler struct {
	repo           *repository.Repository
	forecastClient *service.ForecastClient
}

func NewForecastHandler(repo *repository.Repository, forecastClient *service.ForecastClient) *ForecastHandler {
	return &ForecastHandler{
		repo:           repo,
		forecastClient: forecastClient,
	}
}

// Analyze - полный финансовый анализ с ML-прогнозированием
func (h *ForecastHandler) Analyze(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Получаем все транзакции пользователя
	transactions, err := h.repo.GetTransactions(userID, 1000, 0, "", "", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	if len(transactions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No transactions found"})
		return
	}

	// Преобразуем в формат для ML сервиса
	analyzeTransactions := make([]service.AnalyzeTransaction, 0, len(transactions))
	for _, tx := range transactions {
		analyzeTransactions = append(analyzeTransactions, service.AnalyzeTransaction{
			Date:        tx.Date.Format(time.RFC3339),
			Amount:      tx.Amount,
			Category:    tx.Category,
			IsEssential: tx.IsEssential,
		})
	}

	// Вызываем ML сервис
	result, err := h.forecastClient.Analyze(analyzeTransactions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ML service error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Predict - прогноз расходов на следующий месяц
func (h *ForecastHandler) Predict(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Получаем все транзакции пользователя
	transactions, err := h.repo.GetTransactions(userID, 1000, 0, "", "", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	if len(transactions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No transactions found"})
		return
	}

	// Преобразуем в формат для ML сервиса
	analyzeTransactions := make([]service.AnalyzeTransaction, 0, len(transactions))
	for _, tx := range transactions {
		analyzeTransactions = append(analyzeTransactions, service.AnalyzeTransaction{
			Date:        tx.Date.Format(time.RFC3339),
			Amount:      tx.Amount,
			Category:    tx.Category,
			IsEssential: tx.IsEssential,
		})
	}

	// Вызываем ML сервис
	result, err := h.forecastClient.Analyze(analyzeTransactions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ML service error: " + err.Error()})
		return
	}

	// Возвращаем только прогноз
	c.JSON(http.StatusOK, gin.H{
		"predicted_expense_next_month": result.MLForecast.PredictedExpenseNextMonth,
		"model_used":                   result.MLForecast.ModelUsed,
		"current_monthly_expense":      result.Metrics.AvgMonthlyExpense,
		"current_monthly_income":       result.Metrics.AvgMonthlyIncome,
	})
}
