package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/models"
	"clarity/internal/repository"
	"clarity/internal/service"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	repo         *repository.Repository
	yandexGPT    *service.YandexGPTClient
	healthService *service.HealthScoreService
}

func NewChatHandler(repo *repository.Repository, yandexGPT *service.YandexGPTClient) *ChatHandler {
	return &ChatHandler{
		repo:          repo,
		yandexGPT:     yandexGPT,
		healthService: service.NewHealthScoreService(repo.DB()),
	}
}

type ChatRequest struct {
	Message string `json:"message" binding:"required"`
}

type ChatResponse struct {
	Message string `json:"message"`
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Сохраняем сообщение пользователя
	userMsg := &models.ChatMessage{
		UserID:  userID,
		Role:    "user",
		Content: req.Message,
	}
	if err := h.repo.CreateChatMessage(userMsg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save message"})
		return
	}

	// Собираем контекст о финансах пользователя
	context := h.buildFinancialContext(userID)
	
	// Если контекст пустой, добавляем базовую информацию
	if context == "" {
		context = "У пользователя пока нет финансовых данных. Помоги ему начать работу с системой."
	}

	// Получаем историю чата (последние 10 сообщений)
	history, _ := h.repo.GetChatHistory(userID, 10)
	
	// Формируем сообщения для YandexGPT
	messages := h.buildMessages(context, history, req.Message)
	
	// Проверяем, что есть хотя бы одно валидное сообщение
	if len(messages) == 0 || messages[0].Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не удалось сформировать запрос к AI"})
		return
	}

	// Отправляем в YandexGPT
	response, err := h.yandexGPT.Chat(messages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("AI service error: %v", err)})
		return
	}

	// Сохраняем ответ ассистента
	assistantMsg := &models.ChatMessage{
		UserID:  userID,
		Role:    "assistant",
		Content: response,
	}
	if err := h.repo.CreateChatMessage(assistantMsg); err != nil {
		// Логируем ошибку, но не прерываем ответ
	}

	c.JSON(http.StatusOK, ChatResponse{Message: response})
}

func (h *ChatHandler) GetHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
			if limit > 100 {
				limit = 100
			}
		}
	}

	messages, err := h.repo.GetChatHistory(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chat history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func (h *ChatHandler) buildFinancialContext(userID uint) string {
	var context strings.Builder

	// Health Score
	month := time.Now().Format("2006-01")
	healthScore, err := h.healthService.Calculate(userID, month)
	if err == nil {
		context.WriteString(fmt.Sprintf("Финансовое здоровье: %.1f%% (Grade: %s)\n", healthScore.Score, healthScore.Grade))
		context.WriteString(fmt.Sprintf("- Накопления: %.1f%%\n", healthScore.Components.SavingsRate.Value))
		context.WriteString(fmt.Sprintf("- Финансовая подушка: %.1f месяцев\n", healthScore.Components.EmergencyFund.Value))
		context.WriteString(fmt.Sprintf("- Стабильность расходов: %.1f%%\n", healthScore.Components.SpendingStability.Value))
		context.WriteString(fmt.Sprintf("- Баланс трат: %.1f%%\n\n", healthScore.Components.EssentialRatio.Value))
	}

	// Аналитика за текущий месяц
	db := h.repo.DB()
	startDate := month + "-01"
	monthTime, _ := time.Parse("2006-01", month)
	lastDay := monthTime.AddDate(0, 1, 0).AddDate(0, 0, -1)
	endDate := lastDay.Format("2006-01-02")

	var totalIncome, totalExpense float64
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalIncome)

	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense)

	balance := totalIncome - totalExpense
	
	// Общий баланс (свободные средства) - сумма всех доходов минус расходы
	var totalBalance float64
	db.Model(&models.Transaction{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)").
		Scan(&totalBalance)
	
	context.WriteString(fmt.Sprintf("Финансы за %s:\n", month))
	context.WriteString(fmt.Sprintf("- Доходы: %.2f₽\n", totalIncome))
	context.WriteString(fmt.Sprintf("- Расходы: %.2f₽\n", totalExpense))
	context.WriteString(fmt.Sprintf("- Баланс за месяц: %.2f₽\n", balance))
	context.WriteString(fmt.Sprintf("- Свободные средства (общий баланс): %.2f₽\n\n", totalBalance))
	
	// Разбивка расходов по категориям за месяц
	var categoryData []struct {
		Category string
		Amount   float64
		Count    int
	}
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, startDate, endDate).
		Select("category, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count").
		Group("category").
		Order("amount desc").
		Find(&categoryData)
	
	if len(categoryData) > 0 {
		context.WriteString("Расходы по категориям за месяц:\n")
		for _, item := range categoryData {
			percent := 0.0
			if totalExpense > 0 {
				percent = (item.Amount / totalExpense) * 100
			}
			context.WriteString(fmt.Sprintf("- %s: %.2f₽ (%.1f%%, %d транзакций)\n", 
				item.Category, item.Amount, percent, item.Count))
		}
		context.WriteString("\n")
	}
	
	// Сравнение с предыдущим месяцем
	prevMonthTime := monthTime.AddDate(0, -1, 0)
	prevMonth := prevMonthTime.Format("2006-01")
	prevStartDate := prevMonth + "-01"
	prevLastDay := prevMonthTime.AddDate(0, 1, 0).AddDate(0, 0, -1)
	prevEndDate := prevLastDay.Format("2006-01-02")
	
	var prevIncome, prevExpense float64
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'income' AND date >= ? AND date <= ?", userID, prevStartDate, prevEndDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&prevIncome)
	
	db.Model(&models.Transaction{}).
		Where("user_id = ? AND type = 'expense' AND date >= ? AND date <= ?", userID, prevStartDate, prevEndDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&prevExpense)
	
	if prevIncome > 0 || prevExpense > 0 {
		context.WriteString(fmt.Sprintf("Сравнение с предыдущим месяцем (%s):\n", prevMonth))
		if prevIncome > 0 {
			change := ((totalIncome - prevIncome) / prevIncome) * 100
			context.WriteString(fmt.Sprintf("- Доходы: %.2f₽ → %.2f₽ (", prevIncome, totalIncome))
			if change > 0 {
				context.WriteString(fmt.Sprintf("+%.1f%%)\n", change))
			} else {
				context.WriteString(fmt.Sprintf("%.1f%%)\n", change))
			}
		}
		if prevExpense > 0 {
			change := ((totalExpense - prevExpense) / prevExpense) * 100
			context.WriteString(fmt.Sprintf("- Расходы: %.2f₽ → %.2f₽ (", prevExpense, totalExpense))
			if change > 0 {
				context.WriteString(fmt.Sprintf("+%.1f%%)\n", change))
			} else {
				context.WriteString(fmt.Sprintf("%.1f%%)\n", change))
			}
		}
		context.WriteString("\n")
	}

	// Последние транзакции (топ-10 для лучшего контекста)
	var recentTxs []models.Transaction
	db.Where("user_id = ?", userID).
		Order("date desc").
		Limit(10).
		Find(&recentTxs)

	if len(recentTxs) > 0 {
		context.WriteString("Последние транзакции:\n")
		for _, tx := range recentTxs {
			sign := ""
			if tx.Type == "expense" {
				sign = "-"
			}
			essential := ""
			if tx.Type == "expense" && tx.IsEssential {
				essential = " [обязательное]"
			} else if tx.Type == "expense" {
				essential = " [необязательное]"
			}
			context.WriteString(fmt.Sprintf("- %s: %s%.2f₽ (%s%s) - %s\n", 
				tx.Date.Format("02.01.2006"), sign, tx.Amount, tx.Category, essential, tx.Description))
		}
		context.WriteString("\n")
	}

	// Инвестиции
	var investments []models.Investment
	db.Where("user_id = ?", userID).Find(&investments)
	if len(investments) > 0 {
		var totalInv, totalValue float64
		for _, inv := range investments {
			totalInv += inv.Amount
			if inv.CurrentValue > 0 {
				totalValue += inv.CurrentValue
			} else {
				totalValue += inv.Amount
			}
		}
		context.WriteString(fmt.Sprintf("Инвестиции: %.2f₽ (текущая стоимость: %.2f₽)\n\n", totalInv, totalValue))
	}

	// Вклады
	var deposits []models.Deposit
	db.Where("user_id = ? AND close_date IS NULL", userID).Find(&deposits)
	if len(deposits) > 0 {
		var totalDep float64
		for _, dep := range deposits {
			totalDep += dep.Amount
		}
		context.WriteString(fmt.Sprintf("Активные вклады: %.2f₽\n\n", totalDep))
	}

	return context.String()
}

func (h *ChatHandler) buildMessages(context string, history []models.ChatMessage, currentMessage string) []service.YandexGPTMessage {
	var messages []service.YandexGPTMessage

	// Улучшенный промпт с инструкциями для анализа
	prompt := `Ты финансовый ассистент Clarity. Твоя задача - анализировать конкретные финансовые данные и давать точные рекомендации.

ПРАВИЛА:
1. НЕ упоминай данные, если пользователь их не спрашивает напрямую
2. При приветствии просто поздоровайся кратко, не выдавай данные
3. При анализе используй КОНКРЕТНЫЕ ЦИФРЫ из данных, не общие фразы
4. Анализируй категории расходов - сравнивай суммы, проценты, количество транзакций
5. При вопросах о тратах анализируй категории и давай конкретные советы: "стоит меньше тратить на [категория], там вы потратили [сумма]"
6. Сравнивай текущий месяц с предыдущим, если есть данные
7. Используй разбивку по категориям для конкретных рекомендаций
8. Отвечай кратко, без "воды" и общих фраз

Финансовые данные пользователя (используй только если спрашивают):
` + context + `

Вопрос пользователя: ` + currentMessage + `

Проанализируй вопрос. Если нужны данные - используй конкретные цифры, категории, сравнения. Если нет - отвечай кратко без данных.`

	messages = append(messages, service.YandexGPTMessage{
		Role: "user",
		Text: prompt,
	})

	return messages
}

