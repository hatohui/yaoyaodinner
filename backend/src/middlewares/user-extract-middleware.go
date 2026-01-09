package middlewares

import (
	"github.com/gin-gonic/gin"
)

func ExtractUserMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}