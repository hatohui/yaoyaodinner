package people

import (
	"net/http"
	"yaoyao-functions/src/common/message"
	"yaoyao-functions/src/common/status"

	"github.com/gin-gonic/gin"
)

type PeopleHandler struct {
	peopleService PeopleService
}

func NewHandler(s PeopleService) *PeopleHandler {
	return &PeopleHandler{peopleService: s}
}

func (h *PeopleHandler) GetAllPeople(res *gin.Context) {
	peopleList, err := h.peopleService.GetAllPeople()
	
	if err != nil {
		if (err.Error() == message.NoPeopleFound) {
		res.JSON(http.StatusNotFound, gin.H{
			"status":  status.NotFound,
			"message": err.Error(),
		})
		return
		}

		res.JSON(http.StatusInternalServerError, gin.H{
			"status":  "INTERNAL_SERVER_ERROR",
			"message": err.Error(),
		})
		return
	}

	res.JSON(http.StatusOK, gin.H{
		"people": peopleList,
	})
}