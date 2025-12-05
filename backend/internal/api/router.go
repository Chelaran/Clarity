package api

import (
	"clarity/internal/api/handlers"
	"clarity/internal/api/middleware"
	"clarity/internal/repository"

	"github.com/gin-gonic/gin"
)

func NewRouter(repo *repository.Repository, jwtSecret string) *gin.Engine {
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
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Transactions endpoints will be added here
	}

	return r
}
