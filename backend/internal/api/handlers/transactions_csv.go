package handlers

import (
	"clarity/internal/api/middleware"
	"clarity/internal/models"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// ExportTransactions - экспорт транзакций в CSV
func (h *TransactionHandler) ExportTransactions(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Получаем все транзакции пользователя
	transactions, err := h.repo.GetTransactions(userID, 10000, 0, "", "", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	// Устанавливаем заголовки для скачивания файла
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=transactions_%s.csv", time.Now().Format("20060102_150405")))

	// Создаем CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Записываем заголовки
	headers := []string{"date", "amount", "type", "description", "ref_no", "category", "is_essential"}
	if err := writer.Write(headers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write CSV header"})
		return
	}

	// Записываем транзакции
	for _, tx := range transactions {
		record := []string{
			tx.Date.Format("2006-01-02"),
			fmt.Sprintf("%.2f", tx.Amount),
			tx.Type,
			tx.Description,
			tx.RefNo,
			tx.Category,
			strconv.FormatBool(tx.IsEssential),
		}
		if err := writer.Write(record); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write CSV record"})
			return
		}
	}
}

// ImportTransactionsRequest - запрос на импорт транзакций
type ImportTransactionsRequest struct {
	SkipErrors bool `json:"skip_errors"` // Пропускать ошибки и продолжать импорт
}

// ImportTransactionsResponse - ответ на импорт
type ImportTransactionsResponse struct {
	Total      int `json:"total"`       // Всего строк в CSV
	Imported   int `json:"imported"`    // Успешно импортировано
	Failed     int `json:"failed"`      // Не удалось импортировать
	Errors     []string `json:"errors"` // Список ошибок
}

// ImportTransactions - импорт транзакций из CSV
func (h *TransactionHandler) ImportTransactions(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Получаем файл из формы
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Открываем файл
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to open file"})
		return
	}
	defer src.Close()

	// Парсим параметры
	skipErrors := c.PostForm("skip_errors") == "true"

	// Читаем CSV
	reader := csv.NewReader(src)
	reader.Comma = ','
	reader.Comment = '#'
	reader.TrimLeadingSpace = true

	// Читаем заголовки
	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read CSV header: " + err.Error()})
		return
	}

	// Нормализуем заголовки (убираем пробелы, приводим к нижнему регистру)
	headerMap := make(map[string]int)
	for i, h := range headers {
		headerMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	// Проверяем наличие обязательных полей
	requiredFields := []string{"date", "amount", "type"}
	for _, field := range requiredFields {
		if _, ok := headerMap[field]; !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Missing required field: %s", field)})
			return
		}
	}

	response := ImportTransactionsResponse{
		Errors: []string{},
	}

	// Читаем и обрабатываем строки
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			if !skipErrors {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read CSV record: " + err.Error()})
				return
			}
			response.Errors = append(response.Errors, fmt.Sprintf("CSV read error: %v", err))
			continue
		}

		response.Total++

		// Парсим транзакцию
		tx, parseErr := h.parseCSVRecord(record, headerMap, userID)
		if parseErr != nil {
			response.Failed++
			errorMsg := fmt.Sprintf("Row %d: %v", response.Total, parseErr)
			response.Errors = append(response.Errors, errorMsg)
			if !skipErrors {
				c.JSON(http.StatusBadRequest, gin.H{"error": errorMsg})
				return
			}
			continue
		}

		// ML категоризация для расходов
		if tx.Type == "expense" {
			refNo := tx.RefNo
			if refNo == "" && tx.Description != "" {
				refNo = tx.Description
			}

			result, err := h.mlClient.CategorizeWithDate(refNo, tx.Amount, tx.Date)
			if err == nil {
				// ML сервис доступен
				if tx.Description != "" {
					descCategory := h.classifyByDescription(tx.Description, tx.Amount)
					if descCategory != "Misc" && descCategory != "" {
						tx.Category = descCategory
					} else {
						tx.Category = result.Category
					}
				} else {
					tx.Category = result.Category
				}
			} else {
				// Fallback на описание
				if tx.Description != "" {
					tx.Category = h.classifyByDescription(tx.Description, tx.Amount)
				} else {
					tx.Category = "Другое"
				}
			}
		}

		// Создаем транзакцию
		if err := h.repo.CreateTransaction(tx); err != nil {
			response.Failed++
			errorMsg := fmt.Sprintf("Row %d: Failed to create transaction: %v", response.Total, err)
			response.Errors = append(response.Errors, errorMsg)
			if !skipErrors {
				c.JSON(http.StatusInternalServerError, gin.H{"error": errorMsg})
				return
			}
			continue
		}

		response.Imported++

		// Асинхронная детекция аномалий (не блокируем импорт)
		go h.checkAndNotifyAnomalies(userID, tx)
	}

	c.JSON(http.StatusOK, response)
}

// parseCSVRecord - парсит строку CSV в транзакцию
func (h *TransactionHandler) parseCSVRecord(record []string, headerMap map[string]int, userID uint) (*models.Transaction, error) {
	tx := &models.Transaction{
		UserID: userID,
	}

	// Date (обязательное)
	dateIdx, ok := headerMap["date"]
	if !ok || dateIdx >= len(record) {
		return nil, fmt.Errorf("missing or invalid date field")
	}
	dateStr := strings.TrimSpace(record[dateIdx])
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// Пробуем другие форматы
		formats := []string{"2006/01/02", "02.01.2006", "02-01-2006"}
		parsed := false
		for _, format := range formats {
			if d, e := time.Parse(format, dateStr); e == nil {
				date = d
				parsed = true
				break
			}
		}
		if !parsed {
			return nil, fmt.Errorf("invalid date format: %s (expected YYYY-MM-DD)", dateStr)
		}
	}
	tx.Date = date

	// Amount (обязательное)
	amountIdx, ok := headerMap["amount"]
	if !ok || amountIdx >= len(record) {
		return nil, fmt.Errorf("missing or invalid amount field")
	}
	amountStr := strings.TrimSpace(record[amountIdx])
	// Убираем пробелы и запятые (для формата "1 000,50" или "1,000.50")
	amountStr = strings.ReplaceAll(amountStr, " ", "")
	amountStr = strings.ReplaceAll(amountStr, ",", ".")
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid amount: %s", amountStr)
	}
	tx.Amount = amount

	// Type (обязательное)
	typeIdx, ok := headerMap["type"]
	if !ok || typeIdx >= len(record) {
		return nil, fmt.Errorf("missing or invalid type field")
	}
	typeStr := strings.ToLower(strings.TrimSpace(record[typeIdx]))
	if typeStr != "income" && typeStr != "expense" {
		return nil, fmt.Errorf("invalid type: %s (must be 'income' or 'expense')", typeStr)
	}
	tx.Type = typeStr

	// Description (опциональное)
	if descIdx, ok := headerMap["description"]; ok && descIdx < len(record) {
		tx.Description = strings.TrimSpace(record[descIdx])
	}

	// RefNo (опциональное)
	if refIdx, ok := headerMap["ref_no"]; ok && refIdx < len(record) {
		tx.RefNo = strings.TrimSpace(record[refIdx])
	}

	// Category (опциональное, будет переопределена ML)
	if catIdx, ok := headerMap["category"]; ok && catIdx < len(record) {
		tx.Category = strings.TrimSpace(record[catIdx])
	}

	// IsEssential (опциональное)
	if essIdx, ok := headerMap["is_essential"]; ok && essIdx < len(record) {
		essStr := strings.ToLower(strings.TrimSpace(record[essIdx]))
		tx.IsEssential = essStr == "true" || essStr == "1" || essStr == "yes" || essStr == "да"
	}

	return tx, nil
}

