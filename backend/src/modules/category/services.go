package category

type CategoryService interface {
	GetAllCategories(languageCode string) ([]Category, error)
	GetCategoryByID(categoryID string, languageCode string) (*Category, error)
}

type service struct {
	repo CategoryRepository
}

func NewService(repo CategoryRepository) CategoryService {
	return &service{repo: repo}
}

func (s *service) GetAllCategories(languageCode string) ([]Category, error) {
	return s.repo.FetchAllCategories(languageCode)
}

func (s *service) GetCategoryByID(categoryID string, languageCode string) (*Category, error) {
	return s.repo.FetchCategoryByID(categoryID, languageCode)
} 