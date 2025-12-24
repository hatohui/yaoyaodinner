package category

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, c *CategoryHandler) {
	router.GET("", c.GetAllCategories)
}
