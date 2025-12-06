package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	CreatedAt time.Time `json:"created_at"`
}

func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hash)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)) == nil
}

type Transaction struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	Amount      float64   `gorm:"not null" json:"amount"`
	Description string    `json:"description"`
	RefNo       string    `json:"ref_no"` // Референсный номер транзакции (для ML классификации)
	Category    string    `json:"category"`
	Date        time.Time `gorm:"index" json:"date"`
	Type        string    `gorm:"not null" json:"type"` // income/expense
	IsEssential bool      `json:"is_essential"`
	CreatedAt   time.Time `json:"created_at"`
}

type Prediction struct {
	Month   string  `json:"month"`
	Amount  float64 `json:"amount"`
	Savings float64 `json:"savings"`
}

// Investment - инвестиции пользователя
type Investment struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"not null;index" json:"user_id"`
	Amount       float64   `gorm:"not null" json:"amount"` // Сумма инвестиции
	Type         string    `json:"type"`                   // Тип: акции, облигации, крипта, фонды и т.д.
	Description  string    `json:"description"`            // Описание
	CurrentValue float64   `json:"current_value"`          // Текущая стоимость (опционально)
	Date         time.Time `gorm:"index" json:"date"`      // Дата покупки/вложения
	CreatedAt    time.Time `json:"created_at"`
}

// Deposit - вклады пользователя
type Deposit struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	UserID       uint       `gorm:"not null;index" json:"user_id"`
	Amount       float64    `gorm:"not null" json:"amount"` // Сумма вклада
	InterestRate float64    `json:"interest_rate"`          // Процентная ставка
	Description  string     `json:"description"`            // Описание (название банка, тип вклада)
	OpenDate     time.Time  `gorm:"index" json:"open_date"` // Дата открытия
	CloseDate    *time.Time `json:"close_date,omitempty"`   // Дата закрытия (если закрыт)
	TermMonths   int        `json:"term_months"`            // Срок в месяцах (0 = до востребования)
	CreatedAt    time.Time  `json:"created_at"`
}

// ChatMessage - сообщения в AI-чате
type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Role      string    `gorm:"not null" json:"role"` // "user" или "assistant"
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
