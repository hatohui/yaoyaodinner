package health

import (
	"net/http"
	"yaoyao-functions/src/common/status"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	service Service
}

func NewHandler(s Service) *HealthHandler {
	return &HealthHandler{service: s}
}

func (h *HealthHandler) GET(res *gin.Context) {
	res.JSON(200, gin.H{
		"status":  "running",
		"version": "1.0.0",
		"by":      "Hatohui",
		"for":     "yaoyaodinner",
		"message": "Smh I spotted a stalking bean!",
	})
}

func (h *HealthHandler) CheckHealth(res *gin.Context) {
	dbErr := h.service.CheckDatabaseConnection()
	redisErr := h.service.CheckRedisConnection()
	
	services := gin.H{
		"database": gin.H{
			"status": "healthy",
		},
		"redis": gin.H{
			"status": "healthy",
		},
	}
	
	overallStatus := status.OK
	httpStatus := http.StatusOK
	
	if dbErr != nil {
		services["database"] = gin.H{
			"status":  "unhealthy",
			"message": dbErr.Error(),
		}
		overallStatus = status.ServiceUnavailable
		httpStatus = http.StatusServiceUnavailable
	}
	
	if redisErr != nil {
		services["redis"] = gin.H{
			"status":  "unhealthy",
			"message": redisErr.Error(),
		}
		overallStatus = status.ServiceUnavailable
		httpStatus = http.StatusServiceUnavailable
	}
	
	res.JSON(httpStatus, gin.H{
		"status":   overallStatus,
		"services": services,
	})
}


func (h *HealthHandler) CheckDatabaseConnection(res *gin.Context) {
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

func (h *HealthHandler) CheckRedisConnection(res *gin.Context) {
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