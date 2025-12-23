package health

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, c *Handler) {
	router.GET("/", c.GET)
	router.GET("/database", c.CheckDatabaseConnection)	
	router.GET("/redis", c.CheckRedisConnection)
}