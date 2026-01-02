package middlewares

import "github.com/gin-gonic/gin"

func ErrorBoundaryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				c.JSON(500, gin.H{
					"status":  "INTERNAL_SERVER_ERROR",
					"message": "An unexpected error occurred.",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}