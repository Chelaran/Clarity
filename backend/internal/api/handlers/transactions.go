package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/models"
	"clarity/internal/repository"
	"clarity/internal/service"
	"net/http"
	"strconv"
	"strings"
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
	RefNo       string  `json:"ref_no"` // Референсный номер транзакции
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
		RefNo:       req.RefNo,
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

	// ML категоризация (только для расходов)
	if req.Type == "expense" {
		// Используем ref_no, если есть, иначе description
		refNo := req.RefNo
		if refNo == "" && req.Description != "" {
			refNo = req.Description
		}

		// Пытаемся классифицировать через ML сервис (основной метод)
		result, err := h.mlClient.CategorizeWithDate(refNo, req.Amount, tx.Date)
		if err == nil {
			// ML сервис доступен
			// Сначала проверяем description - если содержит явные ключевые слова, используем их
			if req.Description != "" {
				descCategory := h.classifyByDescription(req.Description, req.Amount)
				// Если description дал конкретную категорию (не Misc), используем её
				// Это важно для случаев типа "Обед в кафе" (должно быть Food, а не Shopping по сумме)
				if descCategory != "Misc" && descCategory != "" {
					tx.Category = descCategory
				} else {
					// Если description не помог, используем результат ML
					tx.Category = result.Category
				}
			} else {
				// Если description пустой, используем результат ML
				tx.Category = result.Category
			}
		} else {
			// ML сервис недоступен - используем fallback по description
			if req.Description != "" {
				tx.Category = h.classifyByDescription(req.Description, req.Amount)
			} else {
				tx.Category = "Misc"
			}
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

// classifyByDescription - классификация по ключевым словам в description
// Используется как приоритетный метод, если description содержит явные ключевые слова
func (h *TransactionHandler) classifyByDescription(description string, amount float64) string {
	if description == "" {
		return "Misc"
	}

	desc := strings.ToLower(description)

	// Проверяем в порядке приоритета (более специфичные сначала)

	// Аренда/Жилье
	if strings.Contains(desc, "аренд") || strings.Contains(desc, "квартир") || strings.Contains(desc, "жилье") ||
		strings.Contains(desc, "коммунал") || strings.Contains(desc, "жкх") || strings.Contains(desc, "управляющ") ||
		strings.Contains(desc, "домофон") || strings.Contains(desc, "консьерж") || strings.Contains(desc, "ипотек") {
		return "Rent"
	}

	// Еда - проверяем, что это не "магазин продуктов" (это Shopping)
	foodKeywords := []string{"еда", "обед", "ужин", "кафе", "ресторан", "столовая", "завтрак", "ланч",
		"пицц", "суши", "бургер", "шашлык", "кофе", "чай", "напиток", "десерт", "морожен", "кондитерск",
		"пекарн", "доставк", "еды", "заказ еды", "едапорт", "delivery", "food", "cafe", "restaurant"}
	for _, keyword := range foodKeywords {
		if strings.Contains(desc, keyword) && !strings.Contains(desc, "магазин") {
			return "Food"
		}
	}
	// Продукты - только если явно указано и не магазин
	if (strings.Contains(desc, "продукт") || strings.Contains(desc, "мясо") || strings.Contains(desc, "рыба") ||
		strings.Contains(desc, "овощ") || strings.Contains(desc, "фрукт") || strings.Contains(desc, "молок") ||
		strings.Contains(desc, "хлеб") || strings.Contains(desc, "бакалея")) && !strings.Contains(desc, "магазин") {
		return "Food"
	}

	// Транспорт
	transportKeywords := []string{"такси", "uber", "yandex", "ситимобил", "gett", "транспорт", "метро",
		"автобус", "троллейбус", "трамвай", "поезд", "электричк", "билет", "проезд", "транспортная карта",
		"транспортная", "каршеринг", "каршеринг", "бензин", "заправк", "азс", "газ", "парковк", "стоянк",
		"штраф", "гибдд", "дпс", "транспортный налог"}
	for _, keyword := range transportKeywords {
		if strings.Contains(desc, keyword) {
			return "Transport"
		}
	}

	// Shopping
	shoppingKeywords := []string{"одежд", "шоппинг", "магазин", "покупк", "торгов", "торговый центр",
		"молл", "бутик", "ателье", "обув", "аксессуар", "электроник", "телефон", "ноутбук", "планшет",
		"техник", "бытов", "мебель", "интерьер", "косметик", "парфюм", "аптек", "лекарств", "медицин",
		"здоровье", "спорт", "фитнес", "тренажер", "абонемент", "книг", "канцтовар", "игрушк", "подарок"}
	for _, keyword := range shoppingKeywords {
		if strings.Contains(desc, keyword) {
			// Исключения для продуктовых магазинов
			if (keyword == "магазин" || keyword == "покупк") &&
				(strings.Contains(desc, "продукт") || strings.Contains(desc, "еда") || strings.Contains(desc, "продуктов")) {
				continue
			}
			return "Shopping"
		}
	}

	// Здоровье/Медицина (может быть отдельной категорией, но пока Shopping)
	if strings.Contains(desc, "больниц") || strings.Contains(desc, "поликлиник") || strings.Contains(desc, "врач") ||
		strings.Contains(desc, "стоматолог") || strings.Contains(desc, "лечение") || strings.Contains(desc, "анализ") {
		return "Shopping" // Или можно добавить отдельную категорию "Health"
	}

	// Образование
	if strings.Contains(desc, "образован") || strings.Contains(desc, "университет") || strings.Contains(desc, "школ") ||
		strings.Contains(desc, "курс") || strings.Contains(desc, "обучен") || strings.Contains(desc, "репетитор") {
		return "Shopping" // Или можно добавить отдельную категорию "Education"
	}

	// Развлечения
	if strings.Contains(desc, "кино") || strings.Contains(desc, "театр") || strings.Contains(desc, "концерт") ||
		strings.Contains(desc, "клуб") || strings.Contains(desc, "бар") || strings.Contains(desc, "развлечен") ||
		strings.Contains(desc, "игра") || strings.Contains(desc, "казино") || strings.Contains(desc, "билет") {
		return "Shopping" // Или можно добавить отдельную категорию "Entertainment"
	}

	// Зарплата - по сумме и ключевым словам
	if amount > 5000 || strings.Contains(desc, "зарплат") || strings.Contains(desc, "заработн") ||
		strings.Contains(desc, "доход") || strings.Contains(desc, "выплат") || strings.Contains(desc, "перевод") {
		return "Salary"
	}

	// Если ничего не подошло - Misc
	return "Misc"
}
