package images

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, c *ImagesHandler) {
	router.GET("/sign-url", c.SignURL)
}
