package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"clarity/internal/api"
	"clarity/internal/config"
	"clarity/internal/repository"
	"clarity/internal/service"

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
	yandexGPT := service.NewYandexGPTClient(cfg.YandexGPTAPIKey, cfg.YandexGPTFolderID, cfg.YandexGPTModelURI)
	router := api.NewRouter(repo, cfg.JWTSecret, cfg.MLServiceURL, yandexGPT)

	addr := ":" + cfg.Port
	server := &http.Server{
		Addr:              addr,
		Handler:           router,
		ReadTimeout:       10 * time.Second,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Info("Starting Clarity on port: %v", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("Server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Info("Shutting down gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("Shutdown error: %v", err)
	} else {
		log.Info("Server stopped")
	}
}
