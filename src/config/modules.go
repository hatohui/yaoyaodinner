package config

import (
	"yaoyao-functions/src/modules/health"
	"yaoyao-functions/src/modules/language"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterModules(router *gin.Engine, db *gorm.DB, redisClient *redis.Client) {
	api := router.Group("/api")
	
	//health module
	healthRepo := health.NewRepository(db, redisClient)
	healthService := health.NewService(healthRepo)
	healthHandler := health.NewHandler(healthService)
	health.RegisterRoutes(api, healthHandler)

	//language module
	langRoute := api.Group("/language")
	languageRepo := language.NewRepository(db, redisClient)
	languageService := language.NewService(languageRepo)
	languageHandler := language.NewHandler(languageService)
	language.RegisterRoutes(langRoute, languageHandler)
}	