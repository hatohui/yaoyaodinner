package category

type CategoryService interface {
	GetAllCategories(languageCode string) ([]Category, error)
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
