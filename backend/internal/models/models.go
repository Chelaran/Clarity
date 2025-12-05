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