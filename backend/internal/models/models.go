package models

import "time"

type Transaction struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Date        time.Time `json:"date"`
	Type        string    `json:"type"` // income/expense
	CreatedAt   time.Time `json:"created_at"`
}

type Prediction struct {
	Month   string  `json:"month"`
	Amount  float64 `json:"amount"`
	Savings float64 `json:"savings"`
}