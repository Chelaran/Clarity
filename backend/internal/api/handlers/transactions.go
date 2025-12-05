package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/models"
	"clarity/internal/repository"
	"clarity/internal/service"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	repo     *repository.Repository
	mlClient *service.MLClient
}

func NewTransactionHandler(repo *repository.Repository, mlClient *service.MLClient) *TransactionHandler {
	return &TransactionHandler{
		repo:     repo,
		mlClient: mlClient,
	}
}

type CreateTransactionRequest struct {
	Amount      float64 `json:"amount" binding:"required"`
	Description string  `json:"description"`
	Date        string  `json:"date"`
	Type        string  `json:"type" binding:"required,oneof=income expense"`
	IsEssential bool    `json:"is_essential"`
}

type UpdateTransactionRequest struct {
	Category string `json:"category" binding:"required"`
}

func (h *TransactionHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := &models.Transaction{
		UserID:      userID,
		Amount:      req.Amount,
		Description: req.Description,
		Type:        req.Type,
		IsEssential: req.IsEssential,
	}

	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
		tx.Date = date
	} else {
		tx.Date = time.Now()
	}

	// ML категоризация
	if req.Description != "" && req.Type == "expense" {
		result, err := h.mlClient.Categorize(req.Description, req.Amount)
		if err == nil {
			tx.Category = result.Category
		}
	}

	if tx.Category == "" {
		tx.Category = "Другое"
	}

	if err := h.repo.CreateTransaction(tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	c.JSON(http.StatusCreated, tx)
}

func (h *TransactionHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	month := c.Query("month")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if limit > 1000 {
		limit = 1000
	}

	txs, err := h.repo.GetTransactions(userID, limit, offset, month, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	c.JSON(http.StatusOK, txs)
}

func (h *TransactionHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	tx, err := h.repo.GetTransactionByID(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	var req UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx.Category = req.Category

	if err := h.repo.UpdateTransaction(tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction"})
		return
	}

	c.JSON(http.StatusOK, tx)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	if err := h.repo.DeleteTransaction(uint(id), userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted"})
}

