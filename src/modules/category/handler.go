package category

import (
	"net/http"
	"yaoyao-functions/src/common/message"
	"yaoyao-functions/src/common/status"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categoryService CategoryService
}

func NewHandler(s CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: s}
}

func (h *CategoryHandler) GetAllCategories(res *gin.Context) {
	languageCode := res.DefaultQuery("lang", "en")

	categories, err := h.categoryService.GetAllCategories(languageCode)

	if len(categories) == 0 {
		res.JSON(http.StatusNotFound, gin.H{
			"status":  status.NotFound,
			"message": message.NoCategoriesFound,
		})
		return
	}

	if err != nil {
		res.JSON(http.StatusInternalServerError, gin.H{
			"status":  status.InternalServer,
			"message": err.Error(),
		})
		return
	}

	res.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
