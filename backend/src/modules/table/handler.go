package table

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type TableHandler interface {
	GetTables(res *gin.Context)
}

type handler struct {
	service TableService
}

func NewHandler(service TableService) TableHandler {
	return &handler{service: service}
}

func (h *handler) GetTables(res *gin.Context) {
	tables, err := h.service.GetTables()
	
	if err != nil {;
		res.JSON(http.StatusNotFound, 
			gin.H{"code": err.Error(), "message": ""})
		return
	}

	res.JSON(http.StatusOK, tables)
}