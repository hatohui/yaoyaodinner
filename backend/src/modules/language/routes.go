package language

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, c *LanguageHandler) {
	router.GET("", c.GetAllLanguages)
	router.GET("/codes", c.GetLanguageCodeList)
}