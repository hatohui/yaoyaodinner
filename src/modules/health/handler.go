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

func (h *Handler) GET(res *gin.Context) {
	res.JSON(200, gin.H{
		"status":  "running",
		"version": "1.0.0",
		"by":      "Hatohui",
		"for":     "yaoyaodinner",
		"message": "Smh I spotted a stalking bean!",
	})
}


func (h *Handler) CheckDatabaseConnection(res *gin.Context) {
	err := h.service.CheckDatabaseConnection()
	
	if err != nil {
		res.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  status.ServiceUnavailable,
			"message": err.Error(),
		})

		return
	}

	res.JSON(http.StatusOK, gin.H{
		"status":  status.OK,
		"message": "Database connection is healthy",
	})
}

func (h *Handler) CheckRedisConnection(res *gin.Context) {
	err := h.service.CheckRedisConnection()
	
	if err != nil {
		res.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  status.ServiceUnavailable,
			"message": err.Error(),
		})

		return
	}

	res.JSON(http.StatusOK, gin.H{
		"status":  status.OK,
		"message": "Redis connection is healthy",
	})
}