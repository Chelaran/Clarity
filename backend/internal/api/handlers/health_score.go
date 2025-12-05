package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/repository"
	"clarity/internal/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type HealthScoreHandler struct {
	healthService *service.HealthScoreService
}

func NewHealthScoreHandler(repo *repository.Repository) *HealthScoreHandler {
	return &HealthScoreHandler{
		healthService: service.NewHealthScoreService(repo.DB()),
	}
}

func (h *HealthScoreHandler) GetHealthScore(c *gin.Context) {
	userID := middleware.GetUserID(c)
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	result, err := h.healthService.Calculate(userID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate health score"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetIncomeDetails - детальная информация о доходах
func (h *HealthScoreHandler) GetIncomeDetails(c *gin.Context) {
	userID := middleware.GetUserID(c)
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	details, err := h.healthService.GetIncomeDetails(userID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get income details"})
		return
	}

	c.JSON(http.StatusOK, details)
}

// GetExpenseDetails - детальная информация о расходах
func (h *HealthScoreHandler) GetExpenseDetails(c *gin.Context) {
	userID := middleware.GetUserID(c)
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	details, err := h.healthService.GetExpenseDetails(userID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expense details"})
		return
	}

	c.JSON(http.StatusOK, details)
}

// GetSavingsDetails - детальная информация о накоплениях
func (h *HealthScoreHandler) GetSavingsDetails(c *gin.Context) {
	userID := middleware.GetUserID(c)

	details, err := h.healthService.GetSavingsDetails(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get savings details"})
		return
	}

	c.JSON(http.StatusOK, details)
}

// GetEssentialRatioDetails - детальная информация о балансе обязательных/необязательных расходов
func (h *HealthScoreHandler) GetEssentialRatioDetails(c *gin.Context) {
	userID := middleware.GetUserID(c)
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	details, err := h.healthService.GetEssentialRatioDetails(userID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get essential ratio details"})
		return
	}

	c.JSON(http.StatusOK, details)
}

