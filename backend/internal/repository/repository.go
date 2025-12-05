package repository

import (
	"clarity/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func (r *Repository) DB() *gorm.DB {
	return r.db
}

func NewDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, db.AutoMigrate(&models.User{}, &models.Transaction{})
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateTransaction(t *models.Transaction) error {
	return r.db.Create(t).Error
}

func (r *Repository) GetTransactions(userID uint, limit, offset int, month, startDate, endDate string) ([]models.Transaction, error) {
	var txs []models.Transaction
	query := r.db.Where("user_id = ?", userID)
	
	if month != "" {
		query = query.Where("DATE_TRUNC('month', date) = ?", month)
	} else if startDate != "" && endDate != "" {
		query = query.Where("date >= ? AND date <= ?", startDate, endDate)
	} else if startDate != "" {
		query = query.Where("date >= ?", startDate)
	} else if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}
	
	err := query.Order("date desc").Limit(limit).Offset(offset).Find(&txs).Error
	return txs, err
}

func (r *Repository) GetTransactionByID(id, userID uint) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *Repository) UpdateTransaction(tx *models.Transaction) error {
	return r.db.Save(tx).Error
}

func (r *Repository) DeleteTransaction(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Transaction{}).Error
}

func (r *Repository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
