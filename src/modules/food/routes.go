package food

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, c *FoodHandler) {
	router.GET("", c.GetFoods)
}
