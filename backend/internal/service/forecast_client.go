package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type ForecastClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewForecastClient(baseURL string) *ForecastClient {
	return &ForecastClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second, // Prophet может занимать время
		},
	}
}

// AnalyzeTransaction - транзакция для анализа
type AnalyzeTransaction struct {
	Date        string  `json:"date"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	IsEssential bool    `json:"is_essential"`
}

// AnalyzeResponse - ответ от ML сервиса
type AnalyzeResponse struct {
	BudgetHealth struct {
		Score        int     `json:"score"`
		Status       string  `json:"status"`
		SavedPercent float64 `json:"saved_percent"`
		SpentPercent float64 `json:"spent_percent"`
		Description  string  `json:"description"`
	} `json:"budget_health"`
	MLForecast struct {
		PredictedExpenseNextMonth float64 `json:"predicted_expense_next_month"`
		ModelUsed                 string  `json:"model_used"`
	} `json:"ml_forecast"`
	FinancialCushion struct {
		TargetAmount    float64 `json:"target_amount"`
		CurrentAmount   float64 `json:"current_amount"`
		ProgressPercent float64 `json:"progress_percent"`
		Reasoning       string  `json:"reasoning"`
	} `json:"financial_cushion"`
	Metrics struct {
		AvgMonthlyIncome  int `json:"avg_monthly_income"`
		AvgMonthlyExpense int `json:"avg_monthly_expense"`
	} `json:"metrics"`
	MandatoryExpenses struct {
		Total      float64  `json:"total"`
		Categories []string `json:"categories"`
	} `json:"mandatory_expenses"`
	OptimizationPlan []struct {
		Category       string `json:"category"`
		CurrentSpend   int    `json:"current_spend"`
		Action         string `json:"action"`
		Recommendation string `json:"recommendation"`
	} `json:"optimization_plan"`
}

// Analyze - полный финансовый анализ с ML-прогнозированием
func (c *ForecastClient) Analyze(transactions []AnalyzeTransaction) (*AnalyzeResponse, error) {
	// ML сервис ожидает массив транзакций напрямую
	jsonData, err := json.Marshal(transactions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := c.httpClient.Post(
		fmt.Sprintf("%s/analyze", c.baseURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to call ML service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ML service error (status %d): %s", resp.StatusCode, string(body))
	}

	var result AnalyzeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}
