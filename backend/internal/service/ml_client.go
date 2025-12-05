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
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

type CategorizeResponse struct {
	Category    string  `json:"category"`
	Confidence  float64 `json:"confidence"`
}

func (c *MLClient) Categorize(description string, amount float64) (*CategorizeResponse, error) {
	reqBody := CategorizeRequest{
		Description: description,
		Amount:      amount,
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

