package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type YandexGPTClient struct {
	apiKey   string
	folderID string
	modelURI string
	baseURL  string
	client   *http.Client
}

func NewYandexGPTClient(apiKey, folderID, modelURI string) *YandexGPTClient {
	return &YandexGPTClient{
		apiKey:   apiKey,
		folderID: folderID,
		modelURI: modelURI,
		baseURL:  "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type YandexGPTMessage struct {
	Role string `json:"role"` // "user" или "assistant"
	Text string `json:"text"`
}

type YandexGPTRequest struct {
	ModelURI          string             `json:"modelUri"`
	CompletionOptions CompletionOptions  `json:"completionOptions"`
	Messages          []YandexGPTMessage `json:"messages"`
}

type CompletionOptions struct {
	Stream      bool    `json:"stream,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
	MaxTokens   string  `json:"maxTokens,omitempty"`
}

type YandexGPTResponse struct {
	Result struct {
		Alternatives []struct {
			Message YandexGPTMessage `json:"message"`
			Status  string           `json:"status"`
		} `json:"alternatives"`
		Usage struct {
			InputTextTokens  string `json:"inputTextTokens"`
			CompletionTokens string `json:"completionTokens"`
			TotalTokens      string `json:"totalTokens"`
		} `json:"usage"`
	} `json:"result"`
}

func (c *YandexGPTClient) Chat(messages []YandexGPTMessage) (string, error) {
	if c.apiKey == "" || c.modelURI == "" {
		return "", fmt.Errorf("YandexGPT не настроен: проверьте API ключ и model URI")
	}

	// Фильтруем пустые сообщения
	var validMessages []YandexGPTMessage
	for _, msg := range messages {
		if msg.Text != "" && (msg.Role == "user" || msg.Role == "assistant") {
			validMessages = append(validMessages, msg)
		}
	}

	if len(validMessages) == 0 {
		return "", fmt.Errorf("нет валидных сообщений для отправки")
	}

	reqBody := YandexGPTRequest{
		ModelURI: c.modelURI,
		CompletionOptions: CompletionOptions{
			Temperature: 0.6,
			MaxTokens:   "2000",
		},
		Messages: validMessages,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("ошибка маршалинга запроса: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("ошибка создания запроса: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Api-Key %s", c.apiKey))

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("ошибка HTTP запроса: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("YandexGPT API ошибка (status %d): %s", resp.StatusCode, string(body))
	}

	var result YandexGPTResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("ошибка декодирования ответа: %w", err)
	}

	if len(result.Result.Alternatives) == 0 {
		return "", fmt.Errorf("пустой ответ от YandexGPT")
	}

	return result.Result.Alternatives[0].Message.Text, nil
}
