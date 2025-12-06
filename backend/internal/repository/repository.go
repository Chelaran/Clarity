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
	return db, db.AutoMigrate(&models.User{}, &models.Transaction{}, &models.Investment{}, &models.Deposit{}, &models.ChatMessage{}, &models.Notification{})
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

// Investment CRUD
func (r *Repository) CreateInvestment(inv *models.Investment) error {
	return r.db.Create(inv).Error
}

func (r *Repository) GetInvestments(userID uint, limit, offset int) ([]models.Investment, error) {
	var invs []models.Investment
	err := r.db.Where("user_id = ?", userID).
		Order("date desc").
		Limit(limit).
		Offset(offset).
		Find(&invs).Error
	return invs, err
}

func (r *Repository) GetInvestmentByID(id, userID uint) (*models.Investment, error) {
	var inv models.Investment
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&inv).Error
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *Repository) UpdateInvestment(inv *models.Investment) error {
	return r.db.Save(inv).Error
}

func (r *Repository) DeleteInvestment(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Investment{}).Error
}

// Deposit CRUD
func (r *Repository) CreateDeposit(dep *models.Deposit) error {
	return r.db.Create(dep).Error
}

func (r *Repository) GetDeposits(userID uint, limit, offset int, activeOnly bool) ([]models.Deposit, error) {
	var deps []models.Deposit
	query := r.db.Where("user_id = ?", userID)
	if activeOnly {
		query = query.Where("close_date IS NULL")
	}
	err := query.Order("open_date desc").
		Limit(limit).
		Offset(offset).
		Find(&deps).Error
	return deps, err
}

func (r *Repository) GetDepositByID(id, userID uint) (*models.Deposit, error) {
	var dep models.Deposit
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&dep).Error
	if err != nil {
		return nil, err
	}
	return &dep, nil
}

func (r *Repository) UpdateDeposit(dep *models.Deposit) error {
	return r.db.Save(dep).Error
}

func (r *Repository) DeleteDeposit(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Deposit{}).Error
}

// ChatMessage CRUD
func (r *Repository) CreateChatMessage(msg *models.ChatMessage) error {
	return r.db.Create(msg).Error
}

func (r *Repository) GetChatHistory(userID uint, limit int) ([]models.ChatMessage, error) {
	var messages []models.ChatMessage
	err := r.db.Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(limit).
		Find(&messages).Error
	// Переворачиваем, чтобы старые сообщения были первыми
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, err
}

// Notification methods
func (r *Repository) CreateNotification(n *models.Notification) error {
	return r.db.Create(n).Error
}

func (r *Repository) GetNotifications(userID uint, limit int, unreadOnly bool) ([]models.Notification, error) {
	var notifications []models.Notification
	query := r.db.Where("user_id = ?", userID)
	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}
	err := query.Order("created_at desc").Limit(limit).Find(&notifications).Error
	return notifications, err
}

func (r *Repository) MarkNotificationAsRead(userID uint, notificationID uint) error {
	return r.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (r *Repository) MarkAllNotificationsAsRead(userID uint) error {
	return r.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}
