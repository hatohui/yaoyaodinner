package config

import (
	"yaoyao-functions/src/modules/category"
	"yaoyao-functions/src/modules/food"
	"yaoyao-functions/src/modules/health"
	"yaoyao-functions/src/modules/images"
	"yaoyao-functions/src/modules/language"
	"yaoyao-functions/src/modules/people"
	"yaoyao-functions/src/modules/table"

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

	//images module
	imagesRoute := api.Group("/images")
	imagesService := images.NewService()
	imagesHandler := images.NewHandler(imagesService)
	images.RegisterRoutes(imagesRoute, imagesHandler)

	//language module
	langRoute := api.Group("/languages")
	languageRepo := language.NewRepository(db)
	languageService := language.NewService(languageRepo)
	languageService = language.NewCachedService(languageService, redisClient)
	languageHandler := language.NewHandler(languageService)
	language.RegisterRoutes(langRoute, languageHandler)

	//category module
	categoryRoute := api.Group("/categories")
	categoryRepo := category.NewRepository(db)
	categoryService := category.NewService(categoryRepo)
	categoryService = category.NewCachedService(categoryService, redisClient)
	categoryHandler := category.NewHandler(categoryService)
	category.RegisterRoutes(categoryRoute, categoryHandler)

	//food module
	foodRoute := api.Group("/foods")
	foodRepo := food.NewRepository(db)
	foodService := food.NewService(foodRepo)
	foodService = food.NewCachedService(foodService, redisClient)
	foodHandler := food.NewHandler(foodService)
	food.RegisterRoutes(foodRoute, foodHandler)

	//people module
	peopleRoute := api.Group("/people")
	peopleRepo := people.NewRepository(db)
	peopleService := people.NewService(peopleRepo)
	peopleHandler := people.NewHandler(peopleService)
	people.RegisterRoutes(peopleRoute, peopleHandler)

	//tables module
	tableRoute := api.Group("/tables")
	tableRepo := table.NewRepository(db)
	tableService := table.NewService(tableRepo)
	tableHandler := table.NewHandler(tableService)
	table.RegisterRoutes(tableRoute, tableHandler)
}	