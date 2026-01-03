package config

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func RegisterCors(router *gin.Engine) {  router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "https://yaoyaodinner.party", "https://www.yaoyaodinner.party"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
  }))
}