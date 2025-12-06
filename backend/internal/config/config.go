package config

import "os"

type Config struct {
	Port              string
	DatabaseURL       string
	MLServiceURL      string
	JWTSecret         string
	YandexGPTAPIKey   string
	YandexGPTFolderID string
	YandexGPTModelURI string
}

func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://localhost/clarity?sslmode=disable"),
		MLServiceURL:      getEnv("ML_SERVICE_URL", "http://localhost:5000"),
		JWTSecret:         getEnv("JWT_SECRET", "clarity-secret-key-change-in-production"),
		YandexGPTAPIKey:   getEnv("YANDEX_CLOUD_API_KEY", ""),
		YandexGPTFolderID: getEnv("YANDEX_CLOUD_FOLDER_ID", ""),
		YandexGPTModelURI: getEnv("YANDEX_GPT_MODEL_URI", ""),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}