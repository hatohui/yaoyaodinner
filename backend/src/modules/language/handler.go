package language

import (
	"net/http"
	"yaoyao-functions/src/common/status"

	"github.com/gin-gonic/gin"
)

type LanguageHandler struct {
	languageService LanguageService
}

func NewHandler(s LanguageService) *LanguageHandler {
	return &LanguageHandler{languageService: s}
}

func (h *LanguageHandler) GetAllLanguages(res *gin.Context) {
	languages, err := h.languageService.GetAllLanguages()

	if err != nil {
		res.JSON(http.StatusInternalServerError, gin.H{
			"status": status.InternalServer,
			"message":  err.Error(),
		})
		return
	}

	res.JSON(http.StatusOK, gin.H{
		"languages": languages,
	})
}

func (h *LanguageHandler) GetLanguageCodeList(res *gin.Context) {
	languages, err := h.languageService.GetLanguageCodeList()

	if err != nil {
		res.JSON(http.StatusInternalServerError, gin.H{
			"status": status.InternalServer,
			"message":  err.Error(),
		})
		return
	}

	res.JSON(http.StatusOK, gin.H{
		"languages": languages,
	})
}