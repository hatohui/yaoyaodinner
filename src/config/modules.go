package config

import (
	"yaoyao-functions/src/modules/health"

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
}	