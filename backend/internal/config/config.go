package config

import "os"

type Config struct {
	Port          string
	DatabaseURL   string
	MLServiceURL  string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://localhost/clarity?sslmode=disable"),
		MLServiceURL: getEnv("ML_SERVICE_URL", "http://localhost:5000"),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}