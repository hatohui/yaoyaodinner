package middlewares

import (
	"net/http"
	"yaoyao-functions/src/common/message"
	"yaoyao-functions/src/common/status"

	"github.com/gin-gonic/gin"
)

func NotFoundMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  status.NotFound,
			"message": message.RouteNotFound,
		})
	}
}