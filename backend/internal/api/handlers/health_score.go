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

