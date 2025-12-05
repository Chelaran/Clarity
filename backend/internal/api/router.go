package api

import (
	"clarity/internal/api/handlers"
	"clarity/internal/api/middleware"
	"clarity/internal/repository"
	"clarity/internal/service"

	"github.com/gin-gonic/gin"
)

func NewRouter(repo *repository.Repository, jwtSecret, mlServiceURL string) *gin.Engine {
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth endpoints
	authHandler := handlers.NewAuthHandler(repo, jwtSecret)
	api := r.Group("/api")
	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)
	}

	// Protected routes
	mlClient := service.NewMLClient(mlServiceURL)
	txHandler := handlers.NewTransactionHandler(repo, mlClient)
	analyticsHandler := handlers.NewAnalyticsHandler(repo)
	healthScoreHandler := handlers.NewHealthScoreHandler(repo)
	investmentHandler := handlers.NewInvestmentHandler(repo)
	depositHandler := handlers.NewDepositHandler(repo)
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		protected.POST("/transactions", txHandler.Create)
		protected.GET("/transactions", txHandler.List)
		protected.PATCH("/transactions/:id", txHandler.Update)
		protected.DELETE("/transactions/:id", txHandler.Delete)

		protected.POST("/investments", investmentHandler.Create)
		protected.GET("/investments", investmentHandler.List)
		protected.PATCH("/investments/:id", investmentHandler.Update)
		protected.DELETE("/investments/:id", investmentHandler.Delete)

		protected.POST("/deposits", depositHandler.Create)
		protected.GET("/deposits", depositHandler.List)
		protected.PATCH("/deposits/:id", depositHandler.Update)
		protected.DELETE("/deposits/:id", depositHandler.Delete)

		protected.GET("/analytics/summary", analyticsHandler.Summary)
		protected.GET("/analytics/trends", analyticsHandler.Trends)

		protected.GET("/health-score", healthScoreHandler.GetHealthScore)
		protected.GET("/health-score/income-details", healthScoreHandler.GetIncomeDetails)
		protected.GET("/health-score/expense-details", healthScoreHandler.GetExpenseDetails)
		protected.GET("/health-score/savings-details", healthScoreHandler.GetSavingsDetails)
		protected.GET("/health-score/essential-details", healthScoreHandler.GetEssentialRatioDetails)
		protected.GET("/health-score/investment-details", healthScoreHandler.GetInvestmentDetails)
		protected.GET("/health-score/deposit-details", healthScoreHandler.GetDepositDetails)
	}

	return r
}
