package table

import "github.com/gin-gonic/gin"

func RegisterRoutes(router *gin.RouterGroup, c TableHandler) {
	router.GET("", c.GetTables)
	router.GET("/:id", c.GetTableByID)
	router.GET("/:id/people", c.GetPeopleInTable)
}
