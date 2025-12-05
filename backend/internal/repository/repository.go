package repository

import (
	"clarity/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, db.AutoMigrate(&models.Transaction{})
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateTransaction(t *models.Transaction) error {
	return r.db.Create(t).Error
}

func (r *Repository) GetTransactions() ([]models.Transaction, error) {
	var txs []models.Transaction
	err := r.db.Order("date desc").Find(&txs).Error
	return txs, err
}
