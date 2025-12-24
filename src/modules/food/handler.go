package food

import (
	"net/http"
	"strconv"
	"yaoyao-functions/src/status"

	"github.com/gin-gonic/gin"
)

type FoodHandler struct {
	foodService FoodService
}

func NewHandler(s FoodService) *FoodHandler {
	return &FoodHandler{foodService: s}
}

func (h *FoodHandler) GetFoods(res *gin.Context) {
	languageCode := res.DefaultQuery("lang", "en")
	pageStr := res.DefaultQuery("page", "1")
	countStr := res.DefaultQuery("count", "10")
	categoryID := res.DefaultQuery("category"	, "all")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	count, err := strconv.Atoi(countStr)
	if err != nil || count < 1 || count > 100 {
		count = 20
	}

	foods, total, err := h.foodService.GetFoodsByPageAndCount(languageCode, page, count, categoryID)

	if err != nil {
		res.JSON(http.StatusInternalServerError, gin.H{
			"status":  status.InternalServer,
			"message": err.Error(),
		})
		return
	}

	res.JSON(http.StatusOK, gin.H{
		"foods": foods,
		"page":  page,
		"count": count,
		"total": total,
	})
}