package table

import (
	"net/http"
	"yaoyao-functions/src/common/message"
	"yaoyao-functions/src/common/status"
	"yaoyao-functions/src/modules/people"

	"github.com/gin-gonic/gin"
)

type TableHandler interface {
	GetTables(res *gin.Context)
	GetTableByID(res *gin.Context)
	GetPeopleInTable(res *gin.Context)
}

type handler struct {
	service TableService
	peopleService people.PeopleService
}

func NewHandler(service TableService, peopleService people.PeopleService) TableHandler {
	return &handler{service: service, peopleService: peopleService}
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

func (h *handler) GetTableByID(res *gin.Context) {
	id := res.Param("id")

	if (id == "") {
		res.JSON(http.StatusBadRequest, 
			gin.H{"code": status.InvalidRequest, "message": message.TableIDRequired})
		return
	}
	
	table, err := h.service.GetTableByID(id);

	if err != nil {;
		res.JSON(http.StatusNotFound, 
			gin.H{"code": status.NotFound, "message": err.Error()})
		return
	}

	res.JSON(http.StatusOK, table)
}

func (h *handler) GetPeopleInTable(res *gin.Context) {
	id := res.Param("id")

	if (id == "") {
		res.JSON(http.StatusBadRequest, 
			gin.H{"code": status.InvalidRequest, "message": message.TableIDRequired})
		return
	}

	people, err := h.peopleService.GetPeopleByTableID(id);

	if err != nil {;
		res.JSON(http.StatusNotFound, 
			gin.H{"code": status.NotFound, "message": err.Error()})
		return
	}

	res.JSON(http.StatusOK, gin.H{
		"people": people,
	})
}