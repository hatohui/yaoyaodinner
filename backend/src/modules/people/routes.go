package people

import "github.com/gin-gonic/gin"

func RegisterRoutes(router *gin.RouterGroup, c *PeopleHandler) {
	router.GET("", c.GetAllPeople)
}