package cmd

import (
	"time"
	"yaoyao-functions/src/config"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"gorm.io/gorm"
)

func Start(db *gorm.DB, redisClient *redis.Client) *gin.Engine {
	router := gin.Default()

  router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "https://yaoyaodinner.party"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
  }))

	config.RegisterModules(router, db, redisClient)
	return router
}