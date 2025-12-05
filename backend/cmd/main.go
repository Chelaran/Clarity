package main

import (
	"clarity/internal/api"
	"clarity/internal/config"
	"clarity/internal/repository"

	logger "github.com/Chelaran/yagalog"
)

func main() {
	log, err := logger.NewLogger()
	if err != nil {
		panic(err)
	}

	cfg := config.Load()

	db, err := repository.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("DB connection failed: %v", err)
	}

	repo := repository.New(db)
	router := api.NewRouter(repo, log)

	log.Info("Starting Clarity on port: %v", cfg.Port)
	router.Run(":" + cfg.Port)
}
