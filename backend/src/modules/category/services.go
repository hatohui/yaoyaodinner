package category

type CategoryService interface {
	GetAllCategories(languageCode string) ([]Category, error)
	GetCategoryByID(categoryID string, languageCode string) (*Category, error)
	ClearCategoryCache() error
}

type service struct {
	repo CategoryRepository
}

func NewService(repo CategoryRepository) CategoryService {
	return &service{repo: repo}
}

func (s *service) GetAllCategories(languageCode string) ([]Category, error) {
	categories, err := s.repo.FetchAllCategories(languageCode)

	if err != nil {
		return nil, err
	}

	return categories, nil
}


func (s *service) ClearCategoryCache() error {
	return s.repo.ClearCategoryCache()
}

func (s *service) GetCategoryByID(categoryID string, languageCode string) (*Category, error) {
	category , err := s.repo.FetchCategoryByID(categoryID, languageCode)
	
	if err != nil {
		return nil, err
	}

	return category, nil
}