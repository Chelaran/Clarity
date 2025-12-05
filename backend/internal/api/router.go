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
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		protected.POST("/transactions", txHandler.Create)
		protected.GET("/transactions", txHandler.List)
		protected.PATCH("/transactions/:id", txHandler.Update)
		protected.DELETE("/transactions/:id", txHandler.Delete)

		protected.GET("/analytics/summary", analyticsHandler.Summary)
		protected.GET("/analytics/trends", analyticsHandler.Trends)

		protected.GET("/health-score", healthScoreHandler.GetHealthScore)
	}

	return r
}
