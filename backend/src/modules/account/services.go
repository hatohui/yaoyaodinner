package account

type AccountService interface {
	
}

type accountService struct {
	repo AccountRepository
}

func NewService(repo AccountRepository) AccountService {
	return &accountService{repo: repo}
}