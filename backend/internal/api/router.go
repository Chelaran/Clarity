package api

import (
    "github.com/gin-gonic/gin"
    "clarity/internal/repository"
)

// NewRouter creates and returns a gin Engine.
// We accept the repo and logger as parameters for future handlers; logger is currently unused.
func NewRouter(repo *repository.Repository, _ interface{}) *gin.Engine {
    r := gin.Default()

    // simple health endpoint
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })

    // placeholder: transactions endpoints can be added here later
    return r
}
