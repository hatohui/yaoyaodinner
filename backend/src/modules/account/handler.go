package account

import "github.com/gin-gonic/gin"


type AccountHandler interface {
	GetAllAccounts(res *gin.Context) 
}

type handler struct {
	service AccountService
}

func NewHandler(service AccountService) AccountHandler {
	return &handler{service: service}
}

func (h *handler) GetAllAccounts(res *gin.Context) {
	// Implementation goes here
}