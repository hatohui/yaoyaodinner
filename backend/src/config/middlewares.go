package config

import (
	"yaoyao-functions/src/middlewares"

	"github.com/gin-gonic/gin"
)


func RegisterMiddlewares(router *gin.Engine) {
	router.Use(middlewares.ErrorBoundaryMiddleware())
	router.NoRoute(middlewares.NotFoundMiddleware())
}