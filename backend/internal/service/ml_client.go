package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type MLClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewMLClient(baseURL string) *MLClient {
	return &MLClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type CategorizeRequest struct {
	Amount float64 `json:"amount" binding:"required"`
	Date   string  `json:"date" binding:"required"`
	RefNo  string  `json:"ref_no" binding:"required"`
}

type CategorizeResponse struct {
	Category    string  `json:"category"`
	Confidence  float64 `json:"confidence"`
}

// Categorize - устаревший метод, используйте CategorizeWithDate
func (c *MLClient) Categorize(description string, amount float64) (*CategorizeResponse, error) {
	return c.CategorizeWithDate(description, amount, time.Now())
}

// CategorizeWithDate - категоризация с датой и ref_no (новый формат)
func (c *MLClient) CategorizeWithDate(refNo string, amount float64, date time.Time) (*CategorizeResponse, error) {
	reqBody := CategorizeRequest{
		Amount: amount,
		Date:   date.Format("2006-01-02"),
		RefNo:  refNo,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Post(
		fmt.Sprintf("%s/categorize", c.baseURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ML service error: %s", string(body))
	}

	var result CategorizeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

