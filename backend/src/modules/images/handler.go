package images

import (
	"net/http"
	"yaoyao-functions/src/common/status"

	"github.com/gin-gonic/gin"
)

type ImagesHandler struct {
	service Service
}

func NewHandler(s Service) *ImagesHandler {
	return &ImagesHandler{service: s}
}

func (h *ImagesHandler) SignURL(c *gin.Context) {
	folder := c.Query("folder")

	if folder == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  status.InvalidRequest,
			"message": "folder query param is required",
		})
		return
	}

	url, key, err := h.service.SignURL(folder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  status.InternalServer,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url": url,
		"key": key,
	})
}
