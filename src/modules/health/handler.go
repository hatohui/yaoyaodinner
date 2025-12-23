package health

import (
	"net/http"
	"yaoyao-functions/src/status"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(s Service) *Handler {
	return &Handler{service: s}
}

func (h *Handler) GET(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":  "running",
		"version": "1.0.0",
		"by":      "Hatohui",
		"for":     "yaoyaodinner",
		"message": "Welcome to the API service!",
	})
}


func (h *Handler) CheckDatabaseConnection(c *gin.Context) {
	err := h.service.CheckDatabaseConnection()
	
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  status.ServiceUnavailable,
			"message": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  status.OK,
		"message": "Database connection is healthy",
	})
}

func (h *Handler) CheckRedisConnection(c *gin.Context) {
	err := h.service.CheckRedisConnection()
	
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  status.ServiceUnavailable,
			"message": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  status.OK,
		"message": "Redis connection is healthy",
	})
}