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

type InvestmentHandler struct {
	repo *repository.Repository
}

func NewInvestmentHandler(repo *repository.Repository) *InvestmentHandler {
	return &InvestmentHandler{repo: repo}
}

type CreateInvestmentRequest struct {
	Amount       float64 `json:"amount" binding:"required"`
	Type         string  `json:"type"`
	Description  string  `json:"description"`
	CurrentValue float64 `json:"current_value"`
	Date         string  `json:"date"`
}

type UpdateInvestmentRequest struct {
	Amount       float64 `json:"amount"`
	Type         string  `json:"type"`
	Description  string  `json:"description"`
	CurrentValue float64 `json:"current_value"`
	Date         string  `json:"date"`
}

func (h *InvestmentHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateInvestmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inv := &models.Investment{
		UserID:      userID,
		Amount:      req.Amount,
		Type:        req.Type,
		Description: req.Description,
		CurrentValue: req.CurrentValue,
		CreatedAt:   time.Now(),
	}

	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
			return
		}
		inv.Date = date
	} else {
		inv.Date = time.Now()
	}

	if err := h.repo.CreateInvestment(inv); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create investment"})
		return
	}

	c.JSON(http.StatusCreated, inv)
}

func (h *InvestmentHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	invs, err := h.repo.GetInvestments(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch investments"})
		return
	}

	c.JSON(http.StatusOK, invs)
}

func (h *InvestmentHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid investment ID"})
		return
	}

	inv, err := h.repo.GetInvestmentByID(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Investment not found"})
		return
	}

	var req UpdateInvestmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount > 0 {
		inv.Amount = req.Amount
	}
	if req.Type != "" {
		inv.Type = req.Type
	}
	if req.Description != "" {
		inv.Description = req.Description
	}
	if req.CurrentValue >= 0 {
		inv.CurrentValue = req.CurrentValue
	}
	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
			return
		}
		inv.Date = date
	}

	if err := h.repo.UpdateInvestment(inv); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update investment"})
		return
	}

	c.JSON(http.StatusOK, inv)
}

func (h *InvestmentHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid investment ID"})
		return
	}

	if err := h.repo.DeleteInvestment(uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete investment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Investment deleted"})
}

