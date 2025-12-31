package config

import (
	"yaoyao-functions/src/modules/category"
	"yaoyao-functions/src/modules/food"
	"yaoyao-functions/src/modules/health"
	"yaoyao-functions/src/modules/language"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterModules(router *gin.Engine, db *gorm.DB, redisClient *redis.Client) {
	api := router.Group("/api")
	
	//public modules
	//health module
	healthRepo := health.NewRepository(db, redisClient)
	healthService := health.NewService(healthRepo)
	healthHandler := health.NewHandler(healthService)
	health.RegisterRoutes(api, healthHandler)

	//language module
	langRoute := api.Group("/languages")
	languageRepo := language.NewRepository(db, redisClient)
	languageService := language.NewService(languageRepo)
	languageHandler := language.NewHandler(languageService)
	language.RegisterRoutes(langRoute, languageHandler)

	//category module
	categoryRoute := api.Group("/categories")
	categoryRepo := category.NewRepository(db, redisClient)
	categoryService := category.NewService(categoryRepo)
	categoryHandler := category.NewHandler(categoryService)
	category.RegisterRoutes(categoryRoute, categoryHandler)

	//food module
	foodRoute := api.Group("/foods")
	foodRepo := food.NewRepository(db, redisClient)
	foodService := food.NewService(foodRepo)
	foodHandler := food.NewHandler(foodService)
	food.RegisterRoutes(foodRoute, foodHandler)
}	