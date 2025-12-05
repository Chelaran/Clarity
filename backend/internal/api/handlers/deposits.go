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

type DepositHandler struct {
	repo *repository.Repository
}

func NewDepositHandler(repo *repository.Repository) *DepositHandler {
	return &DepositHandler{repo: repo}
}

type CreateDepositRequest struct {
	Amount       float64 `json:"amount" binding:"required"`
	InterestRate float64 `json:"interest_rate"`
	Description  string  `json:"description"`
	OpenDate     string  `json:"open_date"`
	TermMonths   int     `json:"term_months"`
}

type UpdateDepositRequest struct {
	Amount       float64 `json:"amount"`
	InterestRate float64 `json:"interest_rate"`
	Description  string  `json:"description"`
	OpenDate     string  `json:"open_date"`
	CloseDate    string  `json:"close_date"`
	TermMonths   int     `json:"term_months"`
}

func (h *DepositHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dep := &models.Deposit{
		UserID:      userID,
		Amount:      req.Amount,
		InterestRate: req.InterestRate,
		Description: req.Description,
		TermMonths:  req.TermMonths,
		CreatedAt:   time.Now(),
	}

	if req.OpenDate != "" {
		date, err := time.Parse("2006-01-02", req.OpenDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
			return
		}
		dep.OpenDate = date
	} else {
		dep.OpenDate = time.Now()
	}

	if err := h.repo.CreateDeposit(dep); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deposit"})
		return
	}

	c.JSON(http.StatusCreated, dep)
}

func (h *DepositHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	activeOnly := c.DefaultQuery("active_only", "false") == "true"

	deps, err := h.repo.GetDeposits(userID, limit, offset, activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deposits"})
		return
	}

	c.JSON(http.StatusOK, deps)
}

func (h *DepositHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deposit ID"})
		return
	}

	dep, err := h.repo.GetDepositByID(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Deposit not found"})
		return
	}

	var req UpdateDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount > 0 {
		dep.Amount = req.Amount
	}
	if req.InterestRate >= 0 {
		dep.InterestRate = req.InterestRate
	}
	if req.Description != "" {
		dep.Description = req.Description
	}
	if req.TermMonths > 0 {
		dep.TermMonths = req.TermMonths
	}
	if req.OpenDate != "" {
		date, err := time.Parse("2006-01-02", req.OpenDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
			return
		}
		dep.OpenDate = date
	}
	if req.CloseDate != "" {
		date, err := time.Parse("2006-01-02", req.CloseDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
			return
		}
		dep.CloseDate = &date
	} else if req.CloseDate == "" && dep.CloseDate != nil {
		// Если хотим открыть закрытый вклад
		dep.CloseDate = nil
	}

	if err := h.repo.UpdateDeposit(dep); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deposit"})
		return
	}

	c.JSON(http.StatusOK, dep)
}

func (h *DepositHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deposit ID"})
		return
	}

	if err := h.repo.DeleteDeposit(uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete deposit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deposit deleted"})
}

