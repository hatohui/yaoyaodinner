package cmd

import (
	"yaoyao-functions/src/config"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func Start(db *gorm.DB, redisClient *redis.Client) *gin.Engine {
	router := gin.Default()
	config.RegisterModules(router, db, redisClient)
	return router
}